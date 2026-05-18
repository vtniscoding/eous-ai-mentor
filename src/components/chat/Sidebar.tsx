import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Crown,
  LayoutDashboard,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  showSidebar: boolean;
  setShowSidebar: (show: boolean) => void;
  handleNewChat: () => void;
  sessions: any[];
  currentSessionId: string | null;
  setCurrentSessionId: (id: string | null) => void;
  selectedFolder: string | null;
  setSelectedFolder: (folder: string | null) => void;
  showDashboard: boolean;
  setShowDashboard: (show: boolean) => void;
  showQuizHub: boolean;
  setShowQuizHub: (show: boolean) => void;
  handleDeleteSession: (id: string, e: React.MouseEvent) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  existingFolders: string[];
  isPro?: boolean;
  onUpgradeClick?: () => void;
}

export function Sidebar({
  isCollapsed,
  setIsCollapsed,
  showSidebar,
  setShowSidebar,
  handleNewChat,
  sessions,
  currentSessionId,
  setCurrentSessionId,
  selectedFolder,
  setSelectedFolder,
  showDashboard,
  setShowDashboard,
  showQuizHub,
  setShowQuizHub,
  handleDeleteSession,
  searchQuery,
  setSearchQuery,
  existingFolders,
  isPro,
  onUpgradeClick,
}: SidebarProps) {
  const handleAction = (callback: () => void) => {
    callback();
    if (window.innerWidth < 768) {
      setShowSidebar(false);
    }
  };

  return (
    <div
      className={`border-r border-border/40 flex flex-col transition-all duration-300 absolute md:relative z-50 md:z-30 h-full bg-card md:bg-card/40 backdrop-blur-xl ${
        isCollapsed ? "md:w-16" : "md:w-64"
      } w-64 ${
        showSidebar ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0`}
    >
      {/* Sidebar Header with Collapse Button */}
      {isCollapsed
        ? (
          /* Collapsed Header */
          <div className="h-14 flex items-center justify-center relative">
            <div
              className="relative w-8 h-8 group cursor-pointer mt-1"
              onClick={() => setIsCollapsed(false)}
            >
              {/* Logo Icon */}
              <img
                src="/app_icon.svg"
                alt="Eous Logo"
                className="h-8 w-8 absolute inset-0 transition-opacity duration-200 group-hover:opacity-0"
              />
              {/* Expand Button */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          </div>
        )
        : (
          /* Expanded Header */
          <div className="h-14 flex items-center justify-start relative p-4">
            <div className="flex items-center ml-2 mt-1 gap-1">
              <span className="text-2xl font-semibold text-foreground">
                Eous
              </span>
              <img src="/app_icon.svg" alt="Eous Logo" className="h-8 w-8" />
              {isPro && (
                <span className="flex items-center justify-center bg-[#1c1c1e] border border-zinc-800 rounded-xl px-2.5 ml-0.5 h-7 shadow-sm">
                  <span className="text-xs font-semibold tracking-wider bg-gradient-to-r from-cyan-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent select-none leading-none flex items-center justify-center">
                    PRO
                  </span>
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(true)}
              className="hidden md:flex absolute right-4"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        )}

      {/* New Chat Button */}
      <div
        className={`border-b border-border/40 flex items-center ${
          isCollapsed ? "pt-1 pb-3 px-2 justify-center" : "pt-1 pb-3 px-4"
        }`}
      >
        {!isCollapsed
          ? (
            <Button
              onClick={() => handleAction(handleNewChat)}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> New Chat
            </Button>
          )
          : (
            <Button
              onClick={() => handleAction(handleNewChat)}
              size="icon"
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white h-10 w-10"
              title="New Chat"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
      </div>

      {!isCollapsed && (
        <>
          {/* Sessions List */}
          <div className="p-4 border-b border-border/40 flex flex-col space-y-2 max-h-48 overflow-y-auto">
            <span className="text-xs font-medium text-muted-foreground uppercase">
              Recent Chats
            </span>
            {sessions.length === 0
              ? (
                <div className="text-xs text-muted-foreground p-1">
                  No chats yet.
                </div>
              )
              : (
                <div className="space-y-1.5 mt-1">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => {
                        handleAction(() => {
                          setCurrentSessionId(session.id);
                          setSelectedFolder(null);
                          setShowDashboard(false);
                          setShowQuizHub(false);
                        });
                      }}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                        currentSessionId === session.id && !selectedFolder
                          ? "bg-purple-500/10 border border-purple-500/30 text-purple-600"
                          : "hover:bg-muted text-foreground"
                      }`}
                    >
                      <div className="text-sm truncate max-w-[180px]">
                        {session.title}
                      </div>
                      <button
                        onClick={(e) => handleDeleteSession(session.id, e)}
                        className="text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
          </div>

          {/* Search */}
          <div className="p-4 border-b border-border/40">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search in this view..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background/50 h-9"
              />
            </div>
          </div>

          {/* Library Filters (Custom Folders) */}
          <div className="p-4 border-b border-border/40 flex flex-col space-y-2">
            <span className="text-xs font-medium text-muted-foreground uppercase">
              Your Library
            </span>

            <div className="flex flex-wrap gap-2">
              {existingFolders.length === 0
                ? (
                  <div className="text-xs text-muted-foreground">
                    No folders yet.
                  </div>
                )
                : (
                  existingFolders.map((folder) => (
                    <Button
                      key={folder}
                      variant={selectedFolder === folder
                        ? "default"
                        : "outline"}
                      size="sm"
                      onClick={() => {
                        handleAction(() => {
                          setSelectedFolder(
                            selectedFolder === folder ? null : folder,
                          );
                          setShowDashboard(false);
                          setShowQuizHub(false);
                        });
                      }}
                      className="h-7 text-xs flex items-center gap-1"
                      title={folder}
                    >
                      <Bookmark className="h-3 w-3 text-purple-500" />
                      {folder}
                    </Button>
                  ))
                )}
            </div>
          </div>

          {/* Tools Section */}
          <div className="p-4 border-b border-border/40 flex flex-col space-y-2">
            <span className="text-xs font-medium text-muted-foreground uppercase">
              Tools
            </span>
            <Button
              variant={showDashboard ? "default" : "outline"}
              size="sm"
              onClick={() => {
                handleAction(() => {
                  setShowDashboard(true);
                  setShowQuizHub(false);
                  setSelectedFolder(null);
                });
              }}
              className="w-fit justify-start gap-2 rounded-full h-8 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border border-emerald-500/20 shadow-sm mt-1"
              title="Dashboard"
            >
              <LayoutDashboard className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium">Dashboard</span>
            </Button>
            <Button
              variant={showQuizHub ? "default" : "outline"}
              size="sm"
              onClick={() => {
                handleAction(() => {
                  setShowQuizHub(true);
                  setShowDashboard(false);
                  setSelectedFolder(null);
                });
              }}
              className="w-fit justify-start gap-2 rounded-full h-8 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 border border-purple-500/20 shadow-sm mt-1"
              title="Quizzes"
            >
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Quizzes</span>
            </Button>
          </div>
        </>
      )}

      {/* Spacer to push Upgrade card to bottom */}
      <div className="flex-1" />

      {/* Pro Upgrade / Premium Status Block */}
      {!isPro && (
        isCollapsed
          ? (
            <div className="p-2 mb-4 flex justify-center">
              <Button
                onClick={onUpgradeClick}
                size="icon"
                className="h-10 w-10 rounded-full transition-all bg-purple-600/10 hover:bg-purple-600/20 text-purple-600 border border-purple-500/30 hover:scale-105"
                title="Upgrade to Pro ✨"
              >
                <Crown className="h-4 w-4" />
              </Button>
            </div>
          )
          : (
            <div className="px-4 mb-4">
              <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/30 rounded-xl p-3.5 shadow-lg shadow-purple-500/5 relative overflow-hidden group hover:border-purple-500/50 transition-all">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                    Unlock Eous Pro
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-500 text-white">
                    PRO
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                  Get unlimited chats, custom flashcards, and textbook scan
                  features.
                </p>
                <Button
                  onClick={onUpgradeClick}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs h-8 rounded-lg shadow-md shadow-purple-500/10 hover:scale-[1.02] transition-all"
                >
                  Upgrade Now ✨
                </Button>
              </div>
            </div>
          )
      )}
    </div>
  );
}
