import { Fragment, useEffect, useRef, useState } from "react";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { useAuth } from "@/context/AuthContext";
import { checkContentSafety, generateResponse } from "@/lib/gemini";
import { QuizHub } from "./QuizHub";
import { Dashboard } from "./Dashboard";
import { Sidebar } from "./Sidebar";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Input } from "@/components/ui/input";
import {
  Bell,
  BellOff,
  Bookmark,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  LogOut,
  Moon,
  Settings,
  Sparkles,
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

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  data: any;
  created_at: string;
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
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(
    false,
  );
  const [dismissedNotifications, setDismissedNotifications] = useState<
    string[]
  >([]);
  const [showMobileProfile, setShowMobileProfile] = useState(false);
  const [showMobileNotifications, setShowMobileNotifications] = useState(false);
  const [isProfileClosing, setIsProfileClosing] = useState(false);
  const [isNotifClosing, setIsNotifClosing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    localStorage.getItem("notificationsEnabled") !== "false",
  );
  const [dbNotifications, setDbNotifications] = useState<Notification[]>([]);
  const [notificationsRead] = useState(false);
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
      // Only handle outside clicks for desktop dropdowns
      if (window.innerWidth >= 768) {
        if (
          userDropdownRef.current &&
          !userDropdownRef.current.contains(event.target as Node)
        ) {
          setShowUserDropdown(false);
        }
        if (
          notificationRef.current &&
          !notificationRef.current.contains(event.target as Node)
        ) {
          setShowNotificationDropdown(false);
        }
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
  const notificationsEnabledRef = useRef(localStorage.getItem("notificationsEnabled") !== "false");
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

  // Handle Android Back Button
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const backButtonListener = CapApp.addListener("backButton", () => {
      const closeProfile = () => {
        setIsProfileClosing(true);
        setTimeout(() => {
          setShowMobileProfile(false);
          setIsProfileClosing(false);
        }, 300);
      };

      const closeNotif = () => {
        setIsNotifClosing(true);
        setTimeout(() => {
          setShowNotificationDropdown(false);
          setIsNotifClosing(false);
        }, 300);
      };

      // Order of priority for closing/going back
      if (showSettings) {
        setShowSettings(false);
      } else if (showMobileProfile) {
        closeProfile();
      } else if (showMobileNotifications) {
        closeNotif();
      } else if (showBookmarkDialog) {
        setShowBookmarkDialog(false);
      } else if (sessionToDelete) {
        setSessionToDelete(null);
      } else if (showNotificationDropdown) {
        setShowNotificationDropdown(false);
      } else if (showUserDropdown) {
        setShowUserDropdown(false);
      } else if (showSidebar) {
        setShowSidebar(false);
      } else if (showQuizHub) {
        setShowQuizHub(false);
        setShowDashboard(true);
      } else if (selectedFolder) {
        setSelectedFolder(null);
        setShowDashboard(true);
      } else if (!showDashboard) {
        // If in chat view, go back to dashboard
        setShowDashboard(true);
      } else {
        // Finally exit if we are at the dashboard home
        CapApp.exitApp();
      }
    });

    return () => {
      backButtonListener.then((l) => l.remove());
    };
  }, [
    showSettings,
    showBookmarkDialog,
    sessionToDelete,
    showNotificationDropdown,
    showUserDropdown,
    showSidebar,
    showQuizHub,
    showMobileProfile,
    selectedFolder,
    showDashboard,
  ]);

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

  // 3. Load notifications from DB
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!profile?.id) return;

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", profile.id)
        .eq("is_read", false)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching notifications:", error);
      } else if (data) {
        setDbNotifications(data);
      }
    };

    fetchNotifications();

    // Set up Realtime subscription
    console.log("Connecting to Realtime for notifications...");
    const channel = supabase
      .channel(`user-notifs`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          // We rely on RLS policies to filter the data for the specific user
        },
        async (payload) => {
          console.log("DATABASE CHANGE DETECTED:", payload.eventType);
          fetchNotifications();

          if (payload.eventType === "INSERT" && notificationsEnabledRef.current) {
            const newNotif = payload.new as Notification;
            console.log("Triggering alert for:", newNotif.title);
            
            if (Capacitor.isNativePlatform()) {
              await LocalNotifications.schedule({
                notifications: [{
                  title: newNotif.title,
                  body: newNotif.message,
                  id: Math.floor(Math.random() * 10000),
                }],
              });
            } else if ("Notification" in window && Notification.permission === "granted") {
              new Notification(newNotif.title, { body: newNotif.message });
            }
          }
        }
      )
      .subscribe((status, err) => {
        console.log("REALTIME STATUS:", status, err ? err : "");
      });

    return () => {
      console.log("Closing Realtime channel");
      supabase.removeChannel(channel);
    };
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

  const registerPushToken = async (token: string, platform: string) => {
    if (!profile?.id) return;

    try {
      const { error } = await supabase.from("push_tokens").upsert(
        {
          user_id: profile.id,
          token: token,
          platform: platform,
          last_seen: new Date().toISOString(),
        },
        { onConflict: "user_id,token" }
      );

      if (error) throw error;
      console.log("Device token registered successfully");
    } catch (err) {
      console.error("Error registering device token:", err);
    }
  };

  const toggleNotifications = async () => {
    if (notificationsEnabled) {
      localStorage.setItem("notificationsEnabled", "false");
      setNotificationsEnabled(false);
      notificationsEnabledRef.current = false;
      toast.success("Notifications turned off");
    } else {
      if (Capacitor.isNativePlatform()) {
        const permission = await LocalNotifications.requestPermissions();
        if (permission.display === "granted") {
          localStorage.setItem("notificationsEnabled", "true");
          setNotificationsEnabled(true);
          notificationsEnabledRef.current = true;
          toast.success("Notifications turned on!");

          // Register native token logic could go here if using Capacitor Push Notifications plugin
          // For now we use a dummy for simulation or you can add the actual PushNotification plugin
          registerPushToken("native-device-token", Capacitor.getPlatform());

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
          notificationsEnabledRef.current = true;
          toast.success("Notifications turned on!");
          new Notification("Eous AI Mentor", {
            body: "You will now receive learning reminders!",
          });

          // Push Subscription Logic
          try {
            const registration = await navigator.serviceWorker.ready;
            const publicVapidKey =
              "BLV2p7w08WQ0oewPkxhntPPNqPZTLa5ggm54T_NCU2pV1v1PRaImOTSNke4ku8hmvOOtewK-iqL294pfQlcrslk";

            const subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
            });

            console.log("Push subscription successful:", subscription);
            registerPushToken(JSON.stringify(subscription), "web");
          } catch (error) {
            console.error("Failed to subscribe to push notifications:", error);
          }
        } else {
          toast.error("Notification permission denied");
        }
      }
    }
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

  // Monitor stats for milestones and trigger alerts
  useEffect(() => {
    if (!profile?.id || !notificationsEnabledRef.current) return;

    const checkMilestones = async () => {
      // 1. Streak Milestone
      if (stats.streak >= 5 && !dismissedNotifications.includes("badge-streak")) {
        const title = "Badge Unlocked! 🏆";
        const message = "🎉 5 Day Streak! You have been studying for 5 days straight!";
        
        // Trigger System Alert
        if (Capacitor.isNativePlatform()) {
          await LocalNotifications.schedule({
            notifications: [{ title, body: message, id: 101 }]
          });
        } else if ("Notification" in window && Notification.permission === "granted") {
          new Notification(title, { body: message });
        }
      }

      // 2. Level Milestone
      if (stats.level > 1 && !dismissedNotifications.includes("level")) {
        const title = "Level Up! ✨";
        const message = `You have reached Level ${stats.level}! Keep going!`;
        
        if (Capacitor.isNativePlatform()) {
          await LocalNotifications.schedule({
            notifications: [{ title, body: message, id: 102 }]
          });
        } else if ("Notification" in window && Notification.permission === "granted") {
          new Notification(title, { body: message });
        }
      }
    };

    checkMilestones();
  }, [stats.streak, stats.level, profile?.id]);

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
          const bookmarkMap = bookmarkData?.reduce(
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
        : [...prev, userMessage]
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
      systemPrompt += `- Subjects of Interest: ${
        profile.subjects?.join(
          ", ",
        )
      }\n\n`;

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

      const responseContent = response ||
        "Sorry, I could not generate a response.";

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
              : s
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
            : msg
        )
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
            : msg
        )
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

      const { data: challengeData, error: challengeError } = await supabase.auth
        .mfa.challenge({ factorId: data.id });
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
      userSubjects.includes(sug.subject)
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

  const closeNotif = () => {
    setIsNotifClosing(true);
    setTimeout(() => {
      setShowMobileNotifications(false);
      setIsNotifClosing(false);
    }, 300);
  };

  const toggleNotif = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.innerWidth < 768) {
      if (showMobileNotifications) {
        closeNotif();
      } else {
        setIsNotifClosing(false);
        setShowMobileNotifications(true);
      }
    } else {
      setShowNotificationDropdown(!showNotificationDropdown);
    }
    setShowUserDropdown(false);
  };

  const dismissNotification = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    // Check if it's a DB notification or a legacy/calculated one
    const dbNotif = dbNotifications.find(n => n.id === id);
    
    if (dbNotif) {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id);
      
      if (error) {
        console.error("Error deleting notification:", error);
      }
      // UI will update via Realtime or local filter
      setDbNotifications(prev => prev.filter(n => n.id !== id));
    } else {
      setDismissedNotifications((prev) => [...prev, id]);
    }
  };

  const renderNotifications = () => {
    const legacyNotifications = [
      {
        id: "mistakes",
        show: (stats.quizzes?.reduce(
          (acc: number, quiz: any) => acc + (quiz.total_questions - quiz.score),
          0,
        ) || 0) > 0,
        render: (
          <div
            className="p-3 bg-purple-500/10 rounded-xl text-sm cursor-pointer hover:bg-purple-500/20 relative group"
            onClick={() => {
              setShowQuizHub(true);
              setShowDashboard(false);
              setSelectedFolder(null);
              if (window.innerWidth < 768) {
                closeNotif();
              } else {
                setShowNotificationDropdown(false);
              }
              dismissNotification("mistakes");
            }}
          >
            <button
              onClick={(e) => dismissNotification("mistakes", e)}
              className="absolute top-2 right-2 p-1 rounded-md hover:bg-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3 text-purple-600" />
            </button>
            <p className="font-bold text-purple-600 mb-0.5">
              Practice Mistakes
            </p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              You have mistakes to practice in the Quiz Hub.
            </p>
          </div>
        ),
      },
      {
        id: "streak",
        show: (stats.streak || 0) > 1,
        render: (
          <div className="p-3 bg-emerald-500/10 rounded-xl text-sm relative group">
            <button
              onClick={(e) => dismissNotification("streak", e)}
              className="absolute top-2 right-2 p-1 rounded-md hover:bg-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3 text-emerald-600" />
            </button>
            <p className="font-bold text-emerald-600 mb-0.5">Streak Reminder</p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              You are on a {stats.streak} day streak! Keep it up.
            </p>
          </div>
        ),
      },
      {
        id: "level",
        show: (stats.level || 1) > 1,
        render: (
          <div className="p-3 bg-blue-500/10 rounded-xl text-sm relative group">
            <button
              onClick={(e) => dismissNotification("level", e)}
              className="absolute top-2 right-2 p-1 rounded-md hover:bg-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3 text-blue-600" />
            </button>
            <p className="font-bold text-blue-600 mb-0.5">Level Status</p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              You are currently at Level {stats.level}.
            </p>
          </div>
        ),
      },
      {
        id: "badge-streak",
        show: stats.streak >= 5,
        render: (
          <div className="p-3 bg-orange-500/10 rounded-xl text-sm relative group">
            <button
              onClick={(e) => dismissNotification("badge-streak", e)}
              className="absolute top-2 right-2 p-1 rounded-md hover:bg-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3 text-orange-600" />
            </button>
            <p className="font-bold text-orange-600 mb-0.5">Badge Unlocked</p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              🎉 5 Day Streak! You have been studying for 5 days straight!
            </p>
          </div>
        ),
      },
      {
        id: "badge-library",
        show: stats.libraryItems >= 5,
        render: (
          <div className="p-3 bg-emerald-500/10 rounded-xl text-sm relative group">
            <button
              onClick={(e) => dismissNotification("badge-library", e)}
              className="absolute top-2 right-2 p-1 rounded-md hover:bg-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3 text-emerald-600" />
            </button>
            <p className="font-bold text-emerald-600 mb-0.5">Badge Unlocked</p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              🎉 Folder Master! You have saved 5 items to your library!
            </p>
          </div>
        ),
      },
      {
        id: "badge-queries",
        show: stats.totalQueries >= 50,
        render: (
          <div className="p-3 bg-blue-500/10 rounded-xl text-sm relative group">
            <button
              onClick={(e) => dismissNotification("badge-queries", e)}
              className="absolute top-2 right-2 p-1 rounded-md hover:bg-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3 text-blue-600" />
            </button>
            <p className="font-bold text-blue-600 mb-0.5">Badge Unlocked</p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              🎉 Ask 50 Questions! You have asked 50 questions to Eous!
            </p>
          </div>
        ),
      },
      {
        id: "badge-quiz",
        show: (stats.quizzes?.length || 0) >= 5,
        render: (
          <div className="p-3 bg-purple-500/10 rounded-xl text-sm relative group">
            <button
              onClick={(e) => dismissNotification("badge-quiz", e)}
              className="absolute top-2 right-2 p-1 rounded-md hover:bg-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3 text-purple-600" />
            </button>
            <p className="font-bold text-purple-600 mb-0.5">Badge Unlocked</p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              🎉 Quiz Master! You have completed 5 quizzes!
            </p>
          </div>
        ),
      },
    ].filter((n) => n.show && !dismissedNotifications.includes(n.id));

    // Combine database notifications with calculated ones
    const allNotifications = [
      ...legacyNotifications.map(n => ({ id: n.id, render: n.render })),
      ...dbNotifications.map(n => ({
        id: n.id,
        render: (
          <div
            key={n.id}
            onClick={() => dismissNotification(n.id)}
            className={`p-3 rounded-xl text-sm relative group cursor-pointer hover:opacity-80 ${
              n.type === 'streak' ? 'bg-emerald-500/10' :
              n.type === 'badge' ? 'bg-orange-500/10' :
              n.type === 'level' ? 'bg-blue-500/10' :
              'bg-purple-500/10'
            }`}
          >
            <button
              onClick={(e) => dismissNotification(n.id, e)}
              className="absolute top-2 right-2 p-1 rounded-md hover:bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
            <p className={`font-bold mb-0.5 ${
              n.type === 'streak' ? 'text-emerald-600' :
              n.type === 'badge' ? 'text-orange-600' :
              n.type === 'level' ? 'text-blue-600' :
              'text-purple-600'
            }`}>{n.title}</p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              {n.message}
            </p>
          </div>
        )
      }))
    ];

    if (allNotifications.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <BellOff className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <div>
            <p className="font-bold text-foreground">All caught up!</p>
            <p className="text-xs text-muted-foreground">
              No new notifications at the moment.
            </p>
          </div>
        </div>
      );
    }

    return allNotifications.map((n) => (
      <Fragment key={n.id}>{n.render}</Fragment>
    ));
  };

  return (
    <div className="flex h-full w-full bg-card/60 backdrop-blur-xl overflow-hidden relative">
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
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
        handleDeleteSession={handleDeleteSession}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        existingFolders={existingFolders}
      />

      <div
        className={`flex-1 flex flex-col relative transition-transform duration-300 ease-in-out ${
          showSidebar ? "translate-x-64 md:translate-x-0" : "translate-x-0"
        }`}
      >
        {/* Mobile Overlay for pushed content */}
        {showSidebar && (
          <div
            className="absolute inset-0 bg-black/60 z-40 md:hidden cursor-pointer animate-in fade-in duration-300"
            onClick={() => setShowSidebar(false)}
          />
        )}
        {/* Header Bar */}
        <div className="h-16 md:h-14 border-b border-border/40 flex items-center justify-between px-4 md:px-6 bg-card/40 backdrop-blur-md relative z-20">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSidebar(true)}
              className="md:hidden h-10 w-10"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
            <span className="font-bold text-base md:text-sm text-foreground">
              {showDashboard
                ? "Dashboard"
                : selectedFolder
                ? `Library: ${selectedFolder}`
                : "AI Mentor Chat"}
            </span>
          </div>

          <div className="flex items-center gap-0 md:gap-2">
            {/* Notification Dropdown */}
            <div className="relative">
              <Button
                variant="ghost"
                onClick={toggleNotif}
                className="relative h-12 w-9 md:h-9 md:w-9 rounded-lg hover:bg-muted flex items-center justify-center p-0"
                title="Notifications"
              >
                <Bell className="h-9 w-9 md:h-5 md:w-5 text-muted-foreground fill-muted-foreground/10 stroke-[2px] md:stroke-2" />
                {!notificationsRead &&
                  ((stats.quizzes?.reduce(
                        (acc: number, quiz: any) =>
                          acc + (quiz.total_questions - quiz.score),
                        0,
                      ) || 0) > 0 ||
                    (stats.streak || 0) > 1) &&
                  (
                    <span className="absolute top-[10px] right-[6px] md:top-1 md:right-1 h-2.5 w-2.5 md:h-2 md:w-2 bg-red-500 rounded-full border-2 border-card" />
                  )}
              </Button>

              {showNotificationDropdown && (
                <div
                  ref={notificationRef}
                  className="hidden md:block absolute top-12 right-0 w-80 bg-card border border-border/40 rounded-xl shadow-2xl p-4 z-50 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm">Notifications</h3>
                  </div>
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {renderNotifications()}
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
                  if (window.innerWidth < 768) {
                    setShowMobileProfile(true);
                  } else {
                    setShowUserDropdown(!showUserDropdown);
                  }
                  setShowNotificationDropdown(false);
                }}
                className="relative h-11 md:h-9 px-2 md:px-3 rounded-lg hover:bg-muted flex items-center gap-2 text-sm"
              >
                <div className="h-8 w-8 md:h-6 md:w-6 rounded-full bg-purple-500/20 flex items-center justify-center font-bold text-purple-600 text-sm md:text-xs">
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
                      setTheme(currentTheme === "dark" ? "light" : "dark")}
                    className="w-full text-left px-2 py-1.5 text-sm rounded-lg hover:bg-muted flex items-center gap-2 transition-colors"
                  >
                    {currentTheme === "dark"
                      ? <Sun className="h-4 w-4 text-muted-foreground" />
                      : <Moon className="h-4 w-4 text-muted-foreground" />}
                    <span>
                      {currentTheme === "dark" ? "Light Mode" : "Dark Mode"}
                    </span>
                  </button>
                  <button
                    onClick={toggleNotifications}
                    className="w-full text-left px-2 py-1.5 text-sm rounded-lg hover:bg-muted flex items-center gap-2 transition-colors"
                  >
                    {notificationsEnabled
                      ? <Bell className="h-4 w-4 text-muted-foreground" />
                      : <BellOff className="h-4 w-4 text-muted-foreground" />}
                    <span>
                      {notificationsEnabled
                        ? "Notifications: On"
                        : "Notifications: Off"}
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

        {showDashboard
          ? <Dashboard stats={stats} />
          : showQuizHub
          ? <QuizHub />
          : (
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
                          handleSendMessage(sug.text, undefined, sug.subject)}
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

              <MessageInput
                onSendMessage={handleSendMessage}
                disabled={loading}
                onStop={handleStopResponding}
                isResponding={loading && isRespondingRef.current}
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
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
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
              <FolderPlus className="h-5 w-5 text-purple-600" />{" "}
              Save to Bookmark Folder
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
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-card border border-border/40 p-6 rounded-2xl shadow-2xl max-w-md w-full relative">
            <button
              onClick={() => setShowSettings(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
              <Settings className="h-5 w-5 text-purple-600" /> Profile Settings
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
                      }))}
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
                      }))}
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
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-card border border-border/40 p-6 rounded-2xl shadow-2xl max-w-md w-full relative">
            <h2 className="text-xl font-bold mb-2">Delete Chat?</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete this chat session? This will also
              delete all messages and bookmarks inside it.
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

      {/* Full-screen Mobile Profile Drawer */}
      {showMobileProfile && (
        <div
          className={`fixed inset-0 bg-card z-[100] md:hidden flex flex-col animate-in ${
            isProfileClosing
              ? "animate-out slide-out-to-right"
              : "slide-in-from-right"
          } duration-300`}
        >
          <div className="h-16 border-b border-border/40 flex items-center justify-between px-4">
            <span className="font-bold text-lg">Profile</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsProfileClosing(true);
                setTimeout(() => {
                  setShowMobileProfile(false);
                  setIsProfileClosing(false);
                }, 300);
              }}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Avatar & Email */}
            <div className="flex flex-col items-center space-y-4">
              <div className="h-24 w-24 rounded-full bg-purple-500/10 flex items-center justify-center font-bold text-purple-600 text-4xl shadow-xl border-4 border-purple-500/20">
                {profile?.email?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="text-center">
                <h3 className="font-bold text-lg">
                  {profile?.display_name || "Student"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {profile?.email}
                </p>
              </div>
            </div>

            {/* Action List */}
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-14 rounded-xl text-base"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("open-settings"));
                }}
              >
                <Settings className="h-5 w-5 text-muted-foreground" />
                Profile Settings
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-14 rounded-xl text-base"
                onClick={() =>
                  setTheme(currentTheme === "dark" ? "light" : "dark")}
              >
                {currentTheme === "dark"
                  ? <Sun className="h-5 w-5 text-muted-foreground" />
                  : <Moon className="h-5 w-5 text-muted-foreground" />}
                {currentTheme === "dark" ? "Light Mode" : "Dark Mode"}
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-14 rounded-xl text-base"
                onClick={toggleNotifications}
              >
                {notificationsEnabled
                  ? <Bell className="h-5 w-5 text-muted-foreground" />
                  : <BellOff className="h-5 w-5 text-muted-foreground" />}
                Notifications: {notificationsEnabled ? "On" : "Off"}
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-14 rounded-xl text-base text-red-500 hover:bg-red-500/10 hover:text-red-600 border-red-500/20"
                onClick={signOut}
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Mobile Notification Drawer */}
      {showMobileNotifications && (
        <div
          className={`fixed inset-0 bg-card z-[100] md:hidden flex flex-col animate-in ${
            isNotifClosing
              ? "animate-out slide-out-to-right"
              : "slide-in-from-right"
          } duration-300`}
        >
          <div className="h-16 border-b border-border/40 flex items-center justify-between px-4">
            <span className="font-bold text-lg">Notifications</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={closeNotif}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {renderNotifications()}
          </div>
        </div>
      )}
    </div>
  );
}
