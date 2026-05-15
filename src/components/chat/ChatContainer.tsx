import { useEffect, useRef, useState } from "react";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { useAuth } from "@/context/AuthContext";
import { generateResponse, checkContentSafety } from "@/lib/gemini";
import { QuizHub } from "./QuizHub";
import { Dashboard } from "./Dashboard";
import { Sidebar } from "./Sidebar";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Input } from "@/components/ui/input";
import {
  Bell,
  Bookmark,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  LogOut,
  Moon,
  Settings,
  Sparkles,
  StopCircle,
  Sun,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  image?: string;
  subject?: string;
  is_bookmarked?: boolean;
  bookmark_folder?: string;
  review_status?: string;
}

interface Session {
  id: string;
  title: string;
  created_at: string;
}

export function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "ai",
      content:
        "Hello! I'm Eous, your AI Study Mentor. How can I help you today?",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDashboard, setShowDashboard] = useState(true);
  const [showQuizHub, setShowQuizHub] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showNotificationDropdown, setShowNotificationDropdown] =
    useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    localStorage.getItem("notificationsEnabled") !== "false",
  );
  const [notificationsRead, setNotificationsRead] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mfaEnrolled, setMfaEnrolled] = useState(false);
  const [mfaQRCode, setMfaQRCode] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaChallengeId, setMfaChallengeId] = useState<string | null>(null);
  const [mfaStep, setMfaStep] = useState<
    "initial" | "scan" | "verify" | "active"
  >("initial");
  const [stats, setStats] = useState({
    totalQueries: 0,
    libraryItems: 0,
    streak: 0,
    studyTime: 0,
    level: 1,
    xp: 0,
    subjectFocus: { math: 0, it: 0, science: 0 },
    quizzes: [] as any[],
  });

  const notificationRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotificationDropdown(false);
      }
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);



  // Sessions State
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Bookmarks Dialog State
  const [showBookmarkDialog, setShowBookmarkDialog] = useState(false);
  const [selectedMessageToBookmark, setSelectedMessageToBookmark] = useState<
    string | null
  >(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [existingFolders, setExistingFolders] = useState<string[]>([]);

  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  // Settings Form State
  const [settingsForm, setSettingsForm] = useState({
    education_level: "university",
    subjects: [] as string[],
    explanation_style: "detailed",
  });

  const isRespondingRef = useRef(false);
  const { profile, user, refreshProfile, signOut } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const { setTheme, theme, resolvedTheme } = useTheme();
  const currentTheme = resolvedTheme || theme;

  // Listen for custom events
  useEffect(() => {
    const handleOpenSettings = () => setShowSettings(true);
    const handleOpenDashboard = () => {
      setShowDashboard(true);
      setSelectedFolder(null);
    };

    window.addEventListener("open-settings", handleOpenSettings);
    window.addEventListener("open-dashboard", handleOpenDashboard);

    return () => {
      window.removeEventListener("open-settings", handleOpenSettings);
      window.removeEventListener("open-dashboard", handleOpenDashboard);
    };
  }, []);

  const fetchDashboardStats = async () => {
    if (!profile?.id) return;

    try {
      // 1. Total Queries
      const { count: queriesCount } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .eq("role", "user");

      // 2. Library Items
      const { count: bookmarksCount } = await supabase
        .from("bookmarks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile.id);

      // 3. Subject Focus
      const { data: subjectData } = await supabase
        .from("messages")
        .select("subject")
        .eq("user_id", profile.id)
        .eq("role", "user");

      // Process subject focus
      const subjects = { math: 0, it: 0, science: 0 };
      subjectData?.forEach((msg) => {
        const sub = msg.subject?.toLowerCase();
        if (sub === "math") subjects.math++;
        else if (sub === "it" || sub === "programming") subjects.it++;
        else if (sub === "science") subjects.science++;
      });

      // 4. Calculate Streak
      const { data: datesData } = await supabase
        .from("messages")
        .select("created_at")
        .eq("user_id", profile.id)
        .eq("role", "user");

      const uniqueDates = [
        ...new Set(
          datesData?.map((d) => new Date(d.created_at).toDateString()),
        ),
      ];
      let streak = 0;
      const today = new Date().toDateString();

      if (uniqueDates.includes(today)) {
        streak = 1;
        let checkDate = new Date();
        while (true) {
          checkDate.setDate(checkDate.getDate() - 1);
          if (uniqueDates.includes(checkDate.toDateString())) {
            streak++;
          } else {
            break;
          }
        }
      }

      // Calculate Level and XP
      const totalXp = (queriesCount || 0) * 10 + (bookmarksCount || 0) * 20;
      const level = Math.floor(totalXp / 100) + 1;
      const currentXp = totalXp % 100;

      // 5. Fetch Quizzes
      const { data: quizzesData } = await supabase
        .from("quizzes")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(5);

      setStats({
        totalQueries: queriesCount || 0,
        libraryItems: bookmarksCount || 0,
        streak,
        studyTime: parseFloat(((queriesCount || 0) * 0.15).toFixed(1)),
        level,
        xp: currentXp,
        subjectFocus: subjects,
        quizzes: quizzesData || [],
      });

      // Check for badge unlocks and show notifications
      setTimeout(() => {
        const notified = JSON.parse(
          localStorage.getItem("notifiedBadges") || "[]",
        );
        const newNotified = [...notified];
        let changed = false;

        if (streak >= 5 && !notified.includes("streak_5")) {
          toast.success("🎉 Badge Unlocked: 5 Day Streak!", {
            description: "You have been studying for 5 days straight!",
          });
          newNotified.push("streak_5");
          changed = true;
        } else if (streak < 5 && notified.includes("streak_5")) {
          const index = newNotified.indexOf("streak_5");
          if (index > -1) newNotified.splice(index, 1);
          changed = true;
        }

        if ((bookmarksCount || 0) >= 5 && !notified.includes("folder_master")) {
          toast.success("🎉 Badge Unlocked: Folder Master!", {
            description: "You have saved 5 items to your library!",
          });
          newNotified.push("folder_master");
          changed = true;
        } else if (
          (bookmarksCount || 0) < 5 &&
          notified.includes("folder_master")
        ) {
          const index = newNotified.indexOf("folder_master");
          if (index > -1) newNotified.splice(index, 1);
          changed = true;
        }

        if ((queriesCount || 0) >= 50 && !notified.includes("ask_50")) {
          toast.success("🎉 Badge Unlocked: Ask 50 Questions!", {
            description: "You have asked 50 questions to Eous!",
          });
          newNotified.push("ask_50");
          changed = true;
        } else if ((queriesCount || 0) < 50 && notified.includes("ask_50")) {
          const index = newNotified.indexOf("ask_50");
          if (index > -1) newNotified.splice(index, 1);
          changed = true;
        }

        if (
          (quizzesData?.length || 0) >= 5 &&
          !notified.includes("quiz_master")
        ) {
          toast.success("🎉 Badge Unlocked: Quiz Master!", {
            description: "You have completed 5 quizzes!",
          });
          newNotified.push("quiz_master");
          changed = true;
        } else if (
          (quizzesData?.length || 0) < 5 &&
          notified.includes("quiz_master")
        ) {
          const index = newNotified.indexOf("quiz_master");
          if (index > -1) newNotified.splice(index, 1);
          changed = true;
        }

        if (changed) {
          localStorage.setItem("notifiedBadges", JSON.stringify(newNotified));
        }
      }, 500);
    } catch (err) {
      console.error("Failed to fetch dashboard stats:", err);
    }
  };

  useEffect(() => {
    if (showDashboard) {
      fetchDashboardStats();
    }
  }, [showDashboard]);

  useEffect(() => {
    if (profile?.id) {
      fetchDashboardStats();
    }
  }, [profile?.id]);

  useEffect(() => {
    if (selectedFolder) {
      setShowQuizHub(false);
      setShowDashboard(false);
    }
  }, [selectedFolder]);

  // 1. Load sessions on mount
  useEffect(() => {
    const fetchSessions = async () => {
      if (!profile?.id) return;

      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching sessions:", error);
      } else if (data) {
        setSessions(data);
        if (data.length > 0 && !currentSessionId) {
          setCurrentSessionId(data[0].id);
        }
      }
    };

    fetchSessions();

    if (profile) {
      setSettingsForm({
        education_level: profile.education_level || "university",
        subjects: profile.subjects || [],
        explanation_style: profile.explanation_style || "detailed",
      });

      // Check MFA status
      const checkMFA = async () => {
        const { data } = await supabase.auth.mfa.listFactors();
        if (data && data.totp && data.totp.length > 0) {
          setMfaEnrolled(true);
          setMfaStep("active");
          setMfaFactorId(data.totp[0].id);
        }
      };
      checkMFA();
    }
  }, [profile]);

  // 2. Load all bookmark folders for the user
  useEffect(() => {
    const fetchFolders = async () => {
      if (!profile?.id) return;

      const { data, error } = await supabase
        .from("bookmarks")
        .select("folder")
        .eq("user_id", profile.id);

      if (error) {
        console.error("Error fetching folders:", error);
      } else if (data) {
        const folders = data
          .map((b) => b.folder)
          .filter((folder): folder is string => Boolean(folder));
        setExistingFolders(Array.from(new Set(folders)));
      }
    };

    fetchFolders();
  }, [profile?.id]);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered:", registration);
        })
        .catch((error) => {
          console.error("SW registration failed:", error);
        });
    }
  }, []);

  const toggleNotifications = async () => {
    if (notificationsEnabled) {
      localStorage.setItem("notificationsEnabled", "false");
      setNotificationsEnabled(false);
      toast.success("Notifications turned off");
    } else {
      if (Capacitor.isNativePlatform()) {
        const permission = await LocalNotifications.requestPermissions();
        if (permission.display === "granted") {
          localStorage.setItem("notificationsEnabled", "true");
          setNotificationsEnabled(true);
          toast.success("Notifications turned on!");
          await LocalNotifications.schedule({
            notifications: [
              {
                title: "Eous AI Mentor",
                body: "You will now receive learning reminders!",
                id: 1,
              },
            ],
          });
        } else {
          toast.error("Notification permission denied");
        }
      } else {
        if (!("Notification" in window)) {
          toast.error("This browser does not support desktop notifications");
          return;
        }
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          localStorage.setItem("notificationsEnabled", "true");
          setNotificationsEnabled(true);
          toast.success("Notifications turned on!");
          new Notification("Eous AI Mentor", {
            body: "You will now receive learning reminders!",
          });

          // Push Subscription Logic
          try {
            const registration = await navigator.serviceWorker.ready;

            // Real VAPID Public Key
            const publicVapidKey =
              "BLV2p7w08WQ0oewPkxhntPPNqPZTLa5ggm54T_NCU2pV1v1PRaImOTSNke4ku8hmvOOtewK-iqL294pfQlcrslk";

            const subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
            });

            console.log("Push subscription successful:", subscription);
            localStorage.setItem(
              "pushSubscription",
              JSON.stringify(subscription),
            );

            // Note: In a real app, you would send this subscription to your Supabase backend:
            // await supabase.from('profiles').update({ push_subscription: subscription }).eq('id', profile?.id);
          } catch (error) {
            console.error("Failed to subscribe to push notifications:", error);
            // Don't fail the whole operation if push fails (might be invalid VAPID key!)
          }
        } else {
          toast.error("Notification permission denied");
        }
      }
    }
  };

  const markAllRead = () => {
      setNotificationsRead(true);
      toast.success("All notifications marked as read");
    };

    // Helper function for Push Notifications
    function urlBase64ToUint8Array(base64String: string) {
      const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
      const base64 = (base64String + padding)
        .replace(/-/g, "+")
        .replace(/_/g, "/");

      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);

      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    }

    // Reset suggestions when switching sessions
    useEffect(() => {
      setShowSuggestions(true);
    }, [currentSessionId]);

    // 3. Load messages for current session (if no folder is selected)
    useEffect(() => {
      const fetchMessages = async () => {
        if (selectedFolder) return; // Skip if we are viewing a folder

        if (!currentSessionId) return;

        setLoading(true);
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("session_id", currentSessionId)
          .order("created_at", { ascending: true });

        if (error) {
          console.error("Error fetching messages:", error);
        } else if (data) {
          if (data.length === 0) {
            setMessages([
              {
                id: "1",
                role: "ai",
                content:
                  "Hello! I'm Eous, your AI Study Mentor. How can I help you today?",
              },
            ]);
          } else {
            // Fetch bookmarks for these messages to set is_bookmarked status
            const { data: bookmarkData } = await supabase
              .from("bookmarks")
              .select("message_id, folder")
              .eq("user_id", profile?.id);

            const bookmarkedIds = bookmarkData?.map((b) => b.message_id) || [];
            const bookmarkMap =
              bookmarkData?.reduce(
                (acc, curr) => {
                  acc[curr.message_id] = curr.folder;
                  return acc;
                },
                {} as Record<string, string>,
              ) || {};

            setMessages(
              data.map((msg) => ({
                id: msg.id,
                role: msg.role as "user" | "ai",
                content: msg.content,
                image: msg.image || undefined,
                subject: msg.subject || undefined,
                is_bookmarked: bookmarkedIds.includes(msg.id),
                bookmark_folder: bookmarkMap[msg.id],
                review_status: msg.review_status,
              })),
            );
          }
        }
        setLoading(false);
      };

      fetchMessages();
    }, [currentSessionId, selectedFolder, profile?.id]);

    // 4. Load messages for selected folder
    useEffect(() => {
      const fetchFolderMessages = async () => {
        if (!selectedFolder || !profile?.id) return;

        setLoading(true);
        const { data, error } = await supabase
          .from("bookmarks")
          .select("message_id, messages(*)")
          .eq("user_id", profile.id)
          .eq("folder", selectedFolder);

        setLoading(false);

        if (error) {
          console.error("Error fetching folder messages:", error);
          toast.error("Failed to load library folder");
        } else if (data) {
          const msgs = data
            .map((d) => d.messages)
            .filter(Boolean)
            .map((msg: any) => ({
              id: msg.id,
              role: msg.role as "user" | "ai",
              content: msg.content,
              image: msg.image || undefined,
              subject: msg.subject || undefined,
              is_bookmarked: true,
              bookmark_folder: selectedFolder,
              review_status: msg.review_status,
            }));

          setMessages(msgs);
        }
      };

      fetchFolderMessages();
    }, [selectedFolder, profile?.id]);

    const handleNewChat = async () => {
      if (!profile?.id) return;

      const { data, error } = await supabase
        .from("sessions")
        .insert({ user_id: profile.id, title: "New Chat" })
        .select()
        .single();

      if (error) {
        toast.error("Failed to create new chat");
        console.error(error);
      } else if (data) {
        setSessions([data, ...sessions]);
        setCurrentSessionId(data.id);
        setSelectedFolder(null); // Switch back to chat view
        setShowDashboard(false);
        setShowQuizHub(false);
        setLoading(true);
        toast.success("New chat started");
      }
    };

    const handleDeleteSession = async (
      sessionId: string,
      e: React.MouseEvent,
    ) => {
      e.stopPropagation();
      setSessionToDelete(sessionId);
    };

    const performDeleteSession = async (sessionId: string) => {
      const { error } = await supabase
        .from("sessions")
        .delete()
        .eq("id", sessionId);

      if (error) {
        toast.error("Failed to delete chat");
        console.error(error);
      } else {
        const updatedSessions = sessions.filter((s) => s.id !== sessionId);
        setSessions(updatedSessions);

        if (currentSessionId === sessionId) {
          setCurrentSessionId(
            updatedSessions.length > 0 ? updatedSessions[0].id : null,
          );
        }
        toast.success("Chat deleted");
      }
    };

    const handleSendMessage = async (
      content: string,
      image?: string,
      subject?: string,
    ) => {
      if (!content.trim() && !image) return;
      if (!profile?.id) {
        toast.error("Profile not loaded yet. Please wait.");
        return;
      }

      if (content.trim()) {
        const safety = await checkContentSafety(content);
        if (!safety.isSafe) {
          toast.error(
            `Message blocked: ${safety.reason || "Inappropriate content"}`,
          );
          return;
        }
      }

      let sessionId = currentSessionId;

      // Auto-create session if none exists or if we are in folder view
      if (!sessionId || selectedFolder) {
        const { data, error } = await supabase
          .from("sessions")
          .insert({ user_id: profile.id, title: content.slice(0, 30) + "..." })
          .select()
          .single();

        if (error) {
          toast.error("Failed to create session");
          return;
        }
        sessionId = data.id;
        setSessions([data, ...sessions]);
        setCurrentSessionId(sessionId);
        setSelectedFolder(null); // Switch back to chat view
      }

      const activeSubject = subject || profile.subjects?.[0] || "General";

      // 1. Save user message to Supabase
      const { data: userData, error: userError } = await supabase
        .from("messages")
        .insert({
          session_id: sessionId,
          user_id: profile.id,
          role: "user",
          content,
          image,
          subject: activeSubject,
        })
        .select()
        .single();

      if (userError) {
        console.error("Error saving user message:", userError);
        toast.error("Failed to save message");
        return;
      }

      const userMessage: Message = {
        id: userData.id,
        role: "user",
        content: userData.content,
        image: userData.image || undefined,
        subject: userData.subject || undefined,
      };

      setMessages((prev) =>
        prev.length === 1 && prev[0].id === "1"
          ? [userMessage]
          : [...prev, userMessage],
      );

      setLoading(true);
      isRespondingRef.current = true;

      try {
        // 2. Build System Prompt
        let systemPrompt =
          "You are Eous, an AI Study Mentor. Your goal is to be helpful, encouraging, and highly accurate.\n\n";

        systemPrompt += "### DOMAIN RESTRICTION (CRITICAL):\n";
        systemPrompt +=
          "You are STRICTLY an educational assistant. You must ONLY answer questions related to studying, academic subjects, education, or basic questions about your identity and capabilities.\n";
        systemPrompt +=
          "If the user asks about ANY unrelated topics, you MUST politely decline to answer and gently guide them back to their studies.\n\n";

        systemPrompt += "### USER CONTEXT:\n";
        systemPrompt += `- Education Level: ${profile.education_level}\n`;
        systemPrompt += `- Subjects of Interest: ${profile.subjects?.join(
          ", ",
        )}\n\n`;

        systemPrompt += "### CRITICAL FORMATTING RULES:\n";

        if (profile.explanation_style === "short") {
          systemPrompt += "- Length: MAXIMUM 2 TO 3 SENTENCES total.\n";
          systemPrompt +=
            "- Format: A single plain paragraph. DO NOT use markdown, bold text, or headers.\n";
        } else if (profile.explanation_style === "detailed") {
          systemPrompt +=
            "- Length: Provide a highly detailed and comprehensive explanation.\n";
          systemPrompt +=
            "- Format: Use markdown to structure your response. Use bold text, paragraphs, and clear formatting.\n";
        } else if (profile.explanation_style === "step_by_step") {
          systemPrompt +=
            "- Format: The ENTIRE response MUST be structured as a numbered list.\n";
          systemPrompt +=
            "- Structure: Break down the concept into logical, sequential steps.\n";
        }

        let maxTokens: number | undefined = undefined;
        if (profile.explanation_style === "short") maxTokens = 150;
        else if (profile.explanation_style === "detailed") maxTokens = 1500;
        else if (profile.explanation_style === "step_by_step") maxTokens = 600;

        // Call Gemini API passing full history
        const updatedMessages = messages
          .filter((m) => m.id !== "1")
          .concat(userMessage);
        const response = await generateResponse(
          updatedMessages,
          systemPrompt,
          maxTokens,
        );

        if (!isRespondingRef.current) return;

        const responseContent =
          response || "Sorry, I could not generate a response.";

        // 3. Save AI message to Supabase
        const { data: aiData, error: aiError } = await supabase
          .from("messages")
          .insert({
            session_id: sessionId,
            user_id: profile.id,
            role: "ai",
            content: responseContent,
            subject: activeSubject,
          })
          .select()
          .single();

        if (aiError) console.error("Error saving AI message:", aiError);

        const aiMessage: Message = {
          id: aiData?.id || (Date.now() + 1).toString(),
          role: "ai",
          content: aiData?.content || responseContent,
          subject: aiData?.subject || undefined,
        };
        setMessages((prev) => [...prev, aiMessage]);

        // Update session title if it was "New Chat"
        const currentSession = sessions.find((s) => s.id === sessionId);
        if (currentSession && currentSession.title === "New Chat") {
          await supabase
            .from("sessions")
            .update({ title: content.slice(0, 30) + "..." })
            .eq("id", sessionId);

          setSessions(
            sessions.map((s) =>
              s.id === sessionId
                ? { ...s, title: content.slice(0, 30) + "..." }
                : s,
            ),
          );
        }
      } catch (error: any) {
        if (isRespondingRef.current) {
          toast.error("Failed to get response from AI");
          console.error(error);
        }
      } finally {
        setLoading(false);
        isRespondingRef.current = false;
      }
    };

    const handleStopResponding = () => {
      isRespondingRef.current = false;
      setLoading(false);
      toast.info("Response stopped");
    };

    const handleOpenBookmarkDialog = (
      messageId: string,
      currentStatus: boolean,
    ) => {
      if (currentStatus) {
        unbookmarkMessage(messageId);
      } else {
        setSelectedMessageToBookmark(messageId);
        setShowBookmarkDialog(true);
      }
    };

    const unbookmarkMessage = async (messageId: string) => {
      if (!profile?.id) return;

      const { error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("message_id", messageId)
        .eq("user_id", profile.id);

      if (error) {
        toast.error("Failed to remove bookmark");
        console.error(error);
      } else {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, is_bookmarked: false, bookmark_folder: undefined }
              : msg,
          ),
        );
        toast.success("Bookmark removed");

        // If we are in folder view, remove it from the list immediately
        if (selectedFolder) {
          setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
        }
      }
    };

    const handleSaveBookmark = async (folder: string) => {
      if (!selectedMessageToBookmark || !profile?.id) return;

      const { error } = await supabase.from("bookmarks").insert({
        user_id: profile.id,
        message_id: selectedMessageToBookmark,
        folder,
      });

      if (error) {
        toast.error("Failed to save bookmark");
        console.error(error);
      } else {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === selectedMessageToBookmark
              ? { ...msg, is_bookmarked: true, bookmark_folder: folder }
              : msg,
          ),
        );
        toast.success(`Saved to folder: ${folder}`);
        setShowBookmarkDialog(false);
        setSelectedMessageToBookmark(null);
        setNewFolderName("");

        if (!existingFolders.includes(folder)) {
          setExistingFolders([...existingFolders, folder]);
        }
      }
    };

    const handleSaveSettings = async () => {
      if (!user?.id) {
        toast.error("User not authenticated");
        return;
      }

      setLoading(true);
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email,
        education_level: settingsForm.education_level,
        subjects: settingsForm.subjects,
        explanation_style: settingsForm.explanation_style,
        onboarding_completed: true,
      });

      setLoading(false);

      if (error) {
        toast.error("Failed to save settings");
        console.error(error);
      } else {
        toast.success("Profile updated successfully!");
        setShowSettings(false);
        refreshProfile();
      }
    };

    const handleEnable2FA = async () => {
      try {
        const { data, error } = await supabase.auth.mfa.enroll({
          factorType: "totp",
        });
        if (error) throw error;

        setMfaFactorId(data.id);
        setMfaQRCode(data.totp.qr_code);
        setMfaStep("scan");

        const { data: challengeData, error: challengeError } =
          await supabase.auth.mfa.challenge({ factorId: data.id });
        if (challengeError) throw challengeError;
        setMfaChallengeId(challengeData.id);
      } catch (error: any) {
        toast.error("Failed to start 2FA: " + error.message);
      }
    };

    const handleVerify2FA = async () => {
      if (!mfaChallengeId || !mfaCode) return;

      try {
        const { error } = await supabase.auth.mfa.verify({
          factorId: mfaFactorId,
          challengeId: mfaChallengeId,
          code: mfaCode,
        } as any);
        if (error) throw error;

        toast.success("2FA enabled successfully!");
        setMfaStep("active");
        setMfaEnrolled(true);
      } catch (error: any) {
        toast.error("Verification failed: " + error.message);
      }
    };

    const handleDisable2FA = async () => {
      if (!mfaFactorId) return;

      try {
        const { error } = await supabase.auth.mfa.unenroll({
          factorId: mfaFactorId,
        });
        if (error) throw error;

        toast.success("2FA disabled successfully!");
        setMfaStep("initial");
        setMfaEnrolled(false);
        setMfaFactorId(null);
        setMfaQRCode(null);
        setMfaCode("");
      } catch (error: any) {
        toast.error("Failed to disable 2FA: " + error.message);
      }
    };

    const toggleSubject = (subject: string) => {
      setSettingsForm((prev) => ({
        ...prev,
        subjects: prev.subjects.includes(subject)
          ? prev.subjects.filter((s) => s !== subject)
          : [...prev.subjects, subject],
      }));
    };

    const getDynamicSuggestions = () => {
      const allSuggestions = [
        { text: "Explain Photosynthesis in biology", subject: "Science" },
        { text: "How to solve a quadratic equation?", subject: "Math" },
        { text: "Summary of the French Revolution", subject: "History" },
        { text: "What is the Pomodoro technique?", subject: "Study Skills" },
        { text: "How to write a binary search in JS?", subject: "Coding" },
        { text: "What is a closure in JS?", subject: "Coding" },
        { text: "Explain the Pythagoras theorem", subject: "Math" },
        { text: "Who was Napoleon Bonaparte?", subject: "History" },
      ];

      const userSubjects = profile?.subjects || [];

      if (userSubjects.length === 0) {
        return allSuggestions.slice(0, 4);
      }

      const filtered = allSuggestions.filter((sug) =>
        userSubjects.includes(sug.subject),
      );

      if (filtered.length === 0) return allSuggestions.slice(0, 4);

      return filtered.slice(0, 4);
    };

    // Filter messages based on search (folder filtering is handled by DB fetch)
    const filteredMessages = messages.filter((msg) => {
      const matchesSearch = msg.content
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      if (msg.id === "1" && messages.length === 1) return true;

      return matchesSearch;
    });

    return (
      <div className="flex h-full w-full bg-card/60 backdrop-blur-xl overflow-hidden relative">
        {/* Sidebar Backdrop (Mobile) */}
        {showSidebar && (
          <div
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
            onClick={() => setShowSidebar(false)}
          />
        )}

        <Sidebar
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          showSidebar={showSidebar}
          handleNewChat={handleNewChat}
          sessions={sessions}
          currentSessionId={currentSessionId}
          setCurrentSessionId={setCurrentSessionId}
          selectedFolder={selectedFolder}
          setSelectedFolder={setSelectedFolder}
          showDashboard={showDashboard}
          setShowDashboard={setShowDashboard}
          showQuizHub={showQuizHub}
          setShowQuizHub={setShowQuizHub}
          setLoading={setLoading}
          handleDeleteSession={handleDeleteSession}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          existingFolders={existingFolders}
        />

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col relative">
          {/* Header Bar */}
          <div className="h-14 border-b border-border/40 flex items-center justify-between px-4 md:px-6 bg-card/40 backdrop-blur-md relative z-20">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSidebar(true)}
                className="md:hidden h-8 w-8"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
              <span className="font-medium text-sm text-foreground">
                {showDashboard
                  ? "Dashboard"
                  : selectedFolder
                    ? `Library: ${selectedFolder}`
                    : "AI Mentor Chat"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Notification Dropdown */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowNotificationDropdown(!showNotificationDropdown);
                    setShowUserDropdown(false);
                  }}
                  className="relative h-9 w-9 rounded-lg hover:bg-muted"
                  title="Notifications"
                >
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  {!notificationsRead &&
                    ((stats.quizzes?.reduce(
                      (acc: number, quiz: any) =>
                        acc + (quiz.total_questions - quiz.score),
                      0,
                    ) || 0) > 0 ||
                      (stats.streak || 0) > 1) && (
                      <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
                    )}
                </Button>

                {showNotificationDropdown && (
                  <div
                    ref={notificationRef}
                    className="fixed inset-x-4 top-16 md:absolute md:top-12 md:right-0 md:left-auto md:w-72 bg-card border border-border/40 rounded-xl shadow-2xl p-4 z-50 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm">Notifications</h3>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={markAllRead}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Mark all read
                        </button>
                        <button
                          onClick={toggleNotifications}
                          className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                        >
                          {notificationsEnabled ? "Turn Off" : "Turn On"}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {(stats.quizzes?.reduce(
                        (acc: number, quiz: any) =>
                          acc + (quiz.total_questions - quiz.score),
                        0,
                      ) || 0) > 0 && (
                        <div
                          className="p-2 bg-purple-500/10 rounded-lg text-xs cursor-pointer hover:bg-purple-500/20"
                          onClick={() => {
                            setShowQuizHub(true);
                            setShowDashboard(false);
                            setSelectedFolder(null);
                            setShowNotificationDropdown(false);
                          }}
                        >
                          <p className="font-medium text-purple-600">
                            Practice Mistakes
                          </p>
                          <p className="text-muted-foreground">
                            You have mistakes to practice in the Quiz Hub.
                          </p>
                        </div>
                      )}
                      {(stats.streak || 0) > 1 && (
                        <div className="p-2 bg-emerald-500/10 rounded-lg text-xs">
                          <p className="font-medium text-emerald-600">
                            Streak Reminder
                          </p>
                          <p className="text-muted-foreground">
                            You are on a {stats.streak} day streak! Keep it up.
                          </p>
                        </div>
                      )}
                      {(stats.level || 1) > 1 && (
                        <div className="p-2 bg-blue-500/10 rounded-lg text-xs">
                          <p className="font-medium text-blue-600">
                            Level Status
                          </p>
                          <p className="text-muted-foreground">
                            You are currently at Level {stats.level}.
                          </p>
                        </div>
                      )}
                      {stats.streak >= 5 && (
                        <div className="p-2 bg-orange-500/10 rounded-lg text-xs">
                          <p className="font-medium text-orange-600">
                            Badge Unlocked
                          </p>
                          <p className="text-muted-foreground">
                            🎉 5 Day Streak! You have been studying for 5 days
                            straight!
                          </p>
                        </div>
                      )}
                      {stats.libraryItems >= 5 && (
                        <div className="p-2 bg-emerald-500/10 rounded-lg text-xs">
                          <p className="font-medium text-emerald-600">
                            Badge Unlocked
                          </p>
                          <p className="text-muted-foreground">
                            🎉 Folder Master! You have saved 5 items to your
                            library!
                          </p>
                        </div>
                      )}
                      {stats.totalQueries >= 50 && (
                        <div className="p-2 bg-blue-500/10 rounded-lg text-xs">
                          <p className="font-medium text-blue-600">
                            Badge Unlocked
                          </p>
                          <p className="text-muted-foreground">
                            🎉 Ask 50 Questions! You have asked 50 questions to
                            Eous!
                          </p>
                        </div>
                      )}
                      {(stats.quizzes?.length || 0) >= 5 && (
                        <div className="p-2 bg-purple-500/10 rounded-lg text-xs">
                          <p className="font-medium text-purple-600">
                            Badge Unlocked
                          </p>
                          <p className="text-muted-foreground">
                            🎉 Quiz Master! You have completed 5 quizzes!
                          </p>
                        </div>
                      )}
                      {/* Fallback if no notifications */}
                      {!(
                        (stats.quizzes?.reduce(
                          (acc: number, quiz: any) =>
                            acc + (quiz.total_questions - quiz.score),
                          0,
                        ) || 0) > 0
                      ) &&
                        !((stats.streak || 0) > 1) &&
                        !(stats.streak >= 5) &&
                        !(stats.libraryItems >= 5) &&
                        !(stats.totalQueries >= 50) &&
                        !((stats.quizzes?.length || 0) >= 5) && (
                          <p className="text-xs text-muted-foreground text-center py-2">
                            No new notifications
                          </p>
                        )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Dropdown */}
              <div className="relative">
                <Button
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUserDropdown(!showUserDropdown);
                    setShowNotificationDropdown(false);
                  }}
                  className="relative h-9 px-1 md:px-3 rounded-lg hover:bg-muted flex items-center gap-2 text-sm"
                >
                  <div className="h-6 w-6 rounded-full bg-purple-500/20 flex items-center justify-center font-bold text-purple-600 text-xs">
                    {profile?.email?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <span className="text-muted-foreground truncate max-w-[100px] hidden md:inline">
                    {profile?.display_name || "Student"}
                  </span>
                </Button>

                {showUserDropdown && (
                  <div
                    ref={userDropdownRef}
                    className="absolute top-12 right-0 w-56 bg-card border border-border/40 rounded-xl shadow-2xl p-2 z-50 space-y-1"
                  >
                    <div className="px-2 py-1.5">
                      <p className="text-xs text-muted-foreground truncate">
                        {profile?.email}
                      </p>
                    </div>
                    <div className="h-px bg-border/40 my-1" />
                    <button
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent("open-settings"));
                        setShowUserDropdown(false);
                      }}
                      className="w-full text-left px-2 py-1.5 text-sm rounded-lg hover:bg-muted flex items-center gap-2 transition-colors"
                    >
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      <span>Profile Settings</span>
                    </button>
                    <button
                      onClick={() =>
                        setTheme(currentTheme === "dark" ? "light" : "dark")
                      }
                      className="w-full text-left px-2 py-1.5 text-sm rounded-lg hover:bg-muted flex items-center gap-2 transition-colors"
                    >
                      {currentTheme === "dark" ? (
                        <Sun className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Moon className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span>
                        {currentTheme === "dark" ? "Light Mode" : "Dark Mode"}
                      </span>
                    </button>

                    <button
                      onClick={signOut}
                      className="w-full text-left px-2 py-1.5 text-sm rounded-lg hover:bg-muted flex items-center gap-2 text-red-500 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {showDashboard ? (
            <Dashboard stats={stats} />
          ) : showQuizHub ? (
            <QuizHub />
          ) : (
            <div className="flex-1 flex flex-col relative overflow-hidden">
              {messages.length <= 1 &&
                !selectedFolder &&
                !loading &&
                showSuggestions && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-card/20 backdrop-blur-sm z-10">
                    <button
                      onClick={() => setShowSuggestions(false)}
                      className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                    <div className="max-w-md w-full text-center mb-6">
                      <Sparkles className="h-10 w-10 text-purple-600 mx-auto mb-2" />
                      <h2 className="text-xl font-bold">Suggested for You</h2>
                      <p className="text-sm text-muted-foreground">
                        Based on your interests
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full">
                      {getDynamicSuggestions().map((sug, idx) => (
                        <button
                          key={idx}
                          onClick={() =>
                            handleSendMessage(sug.text, undefined, sug.subject)
                          }
                          className="p-4 text-left bg-background/80 hover:bg-purple-500/5 border border-border/40 rounded-xl transition-all hover:border-purple-500/30 shadow-sm flex flex-col justify-between h-24"
                        >
                          <div className="font-medium text-sm text-foreground">
                            {sug.text}
                          </div>
                          <div className="text-muted-foreground text-[10px] uppercase font-bold mt-1">
                            {sug.subject}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              {selectedFolder && messages.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 z-10">
                  <Bookmark className="h-10 w-10 text-muted-foreground mb-2" />
                  <h2 className="text-xl font-bold">Folder is Empty</h2>
                  <p className="text-sm text-muted-foreground">
                    Bookmark some answers to see them here.
                  </p>
                </div>
              )}

              <MessageList
                messages={filteredMessages}
                loading={loading}
                isResponding={isRespondingRef.current}
                onToggleBookmark={handleOpenBookmarkDialog}
              />

              {/* Stop Responding Button */}
              {loading && isRespondingRef.current && (
                <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-10">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStopResponding}
                    className="bg-background/80 backdrop-blur-sm border-purple-500/30 hover:bg-purple-500/10 hover:text-purple-600 transition-all shadow-lg"
                  >
                    <StopCircle className="h-4 w-4 mr-2 text-purple-600" />
                    Stop Responding
                  </Button>
                </div>
              )}

              <MessageInput
                onSendMessage={handleSendMessage}
                disabled={loading}
              />
              <div className="text-center text-xs text-muted-foreground pb-4">
                The app is still in development. AI can make mistake, so
                double-check response
              </div>
            </div>
          )}
        </div>

        {/* Custom Bookmark Dialog */}
        {showBookmarkDialog && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border/40 p-6 rounded-2xl shadow-2xl max-w-md w-full relative">
              <button
                onClick={() => {
                  setShowBookmarkDialog(false);
                  setSelectedMessageToBookmark(null);
                }}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>

              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FolderPlus className="h-5 w-5 text-purple-600" /> Save to
                Bookmark Folder
              </h2>

              <div className="space-y-4">
                {/* Existing Folders */}
                {existingFolders.length > 0 && (
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Choose Existing Folder
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {existingFolders.map((folder) => (
                        <button
                          key={folder}
                          onClick={() => handleSaveBookmark(folder)}
                          className="h-8 px-3 text-xs rounded-full border border-border/40 bg-background/50 hover:bg-purple-500/10 text-foreground transition-all"
                        >
                          {folder}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Folder */}
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Or Create New Folder
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Folder name..."
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      className="h-10"
                    />
                    <Button
                      onClick={() => handleSaveBookmark(newFolderName)}
                      disabled={!newFolderName.trim()}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border/40 p-6 rounded-2xl shadow-2xl max-w-md w-full relative">
              <button
                onClick={() => setShowSettings(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>

              <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
                <Settings className="h-5 w-5 text-purple-600" /> Profile
                Settings
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Education Level
                  </label>
                  <div className="relative">
                    <select
                      value={settingsForm.education_level}
                      onChange={(e) =>
                        setSettingsForm((prev) => ({
                          ...prev,
                          education_level: e.target.value,
                        }))
                      }
                      className="w-full h-10 bg-background/50 border border-border/40 rounded-lg px-3 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 appearance-none"
                    >
                      <option value="middle_school">Middle School</option>
                      <option value="high_school">High School</option>
                      <option value="university">University</option>
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Explanation Style
                  </label>
                  <div className="relative">
                    <select
                      value={settingsForm.explanation_style}
                      onChange={(e) =>
                        setSettingsForm((prev) => ({
                          ...prev,
                          explanation_style: e.target.value,
                        }))
                      }
                      className="w-full h-10 bg-background/50 border border-border/40 rounded-lg px-3 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 appearance-none"
                    >
                      <option value="short">Short & Sweet</option>
                      <option value="detailed">Detailed & Comprehensive</option>
                      <option value="step_by_step">
                        Step-by-Step Breakdown
                      </option>
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Subjects of Interest
                  </label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {[
                      "Math",
                      "Science",
                      "History",
                      "Literature",
                      "Coding",
                      "Languages",
                    ].map((subj) => (
                      <button
                        key={subj}
                        onClick={() => toggleSubject(subj)}
                        className={`h-8 px-3 text-xs rounded-full border transition-all ${
                          settingsForm.subjects.includes(subj)
                            ? "bg-purple-600 border-purple-600 text-white"
                            : "bg-background/50 border-border/40 text-foreground hover:bg-purple-500/10"
                        }`}
                      >
                        {subj}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border/40 pt-4 mt-4">
                  <label className="text-sm font-medium mb-1 block">
                    Two-Factor Authentication (2FA)
                  </label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Enhance your account security by using an authenticator app.
                  </p>

                  {mfaStep === "initial" && !mfaEnrolled && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleEnable2FA}
                      className="text-xs"
                    >
                      Enable 2FA
                    </Button>
                  )}

                  {mfaStep === "scan" && mfaQRCode && (
                    <div className="space-y-3">
                      <p className="text-xs font-medium">
                        1. Scan this QR Code with your Authenticator app:
                      </p>
                      <img
                        src={mfaQRCode}
                        alt="2FA QR Code"
                        className="w-32 h-32 bg-white p-2 rounded-lg"
                      />
                      <p className="text-xs font-medium">
                        2. Enter the 6-digit code from the app:
                      </p>
                      <div className="flex gap-2">
                        <Input
                          value={mfaCode}
                          onChange={(e) => setMfaCode(e.target.value)}
                          placeholder="000000"
                          className="w-32 h-9 text-sm"
                          maxLength={6}
                        />
                        <Button size="sm" onClick={handleVerify2FA}>
                          Verify
                        </Button>
                      </div>
                    </div>
                  )}

                  {(mfaStep === "active" || mfaEnrolled) && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-600 text-xs font-medium">
                        <span className="h-2 w-2 bg-emerald-600 rounded-full" />
                        2FA is Active
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDisable2FA}
                        className="h-8 text-xs text-red-500 hover:text-red-600 border-red-500/20 hover:border-red-500/40"
                      >
                        Disable
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowSettings(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveSettings}
                  disabled={loading}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {sessionToDelete && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border/40 p-6 rounded-2xl shadow-2xl max-w-md w-full relative">
              <h2 className="text-xl font-bold mb-2">Delete Chat?</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Are you sure you want to delete this chat session? This will
                also delete all messages and bookmarks inside it.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSessionToDelete(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    performDeleteSession(sessionToDelete);
                    setSessionToDelete(null);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
}
