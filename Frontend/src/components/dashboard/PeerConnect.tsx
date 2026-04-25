import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Flame, ShieldCheck, Sparkles, User, BookOpen, PenTool, Mic, Send } from 'lucide-react';
import { getMainApiBase } from '@/lib/apiBase';

/** Same origin as main API by default. Override with VITE_CHAUTARA_API_URL only if Chautara is split out. */
const API =
  import.meta.env.VITE_CHAUTARA_API_URL ?? `${getMainApiBase()}/api/chautara`;

const PeerConnect = () => {
  const { toast } = useToast();

  const [feed, setFeed] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [mode, setMode] = useState<'share' | 'read'>('share');
  const [isListening, setIsListening] = useState(false);
  const [commentInputs, setCommentInputs] = useState<{[key: string]: string}>({});

  // ---------------- LOAD FEED ---------------- //
  const loadFeed = async () => {
    try {
      const res = await fetch(`${API}/feed`);
      const data = await res.json();
      setFeed(data);
    } catch (e) {
      console.error("Feed error:", e);
    }
  };

  useEffect(() => {
    loadFeed();
    const interval = setInterval(loadFeed, 3000);
    return () => clearInterval(interval);
  }, []);

  // ---------------- VOICE ---------------- //
  const startVoice = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) return alert("Mic not supported");

    const recognition = new SpeechRecognition();
    recognition.lang = 'ne-NP';

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e: any) =>
      setText(prev => prev + " " + e.results[0][0].transcript);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  // ---------------- POST STORY ---------------- //
  const handlePost = async () => {
    if (!text.trim()) return;

    try {
      const res = await fetch(`${API}/post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text })
      });

      if (!res.ok) throw new Error("Post failed");

      setText("");
      setMode('read');
      await loadFeed();

      toast({
        title: "Story Witnessed",
        description: "Your story has been added to the sanctuary."
      });

    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to post story"
      });
    }
  };

  // ---------------- COMMENT ---------------- //
  const handleManualComment = async (storyId: string) => {
    const content = commentInputs[storyId];
    if (!content || !content.trim()) return;

    try {
      const res = await fetch(`${API}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story_id: storyId, content })
      });

      if (!res.ok) throw new Error("Blocked");

      setCommentInputs(prev => ({ ...prev, [storyId]: "" }));
      await loadFeed();

      toast({ title: "Support sent ❤️" });

    } catch (e) {
      toast({
        variant: "destructive",
        title: "Blocked",
        description: "Message not allowed"
      });
    }
  };

  // ---------------- UI ---------------- //
  return (
    <div className="max-w-3xl mx-auto h-screen flex flex-col pb-6 px-4 bg-gradient-to-b from-slate-50 to-white">

      {/* HEADER */}
      <div className="py-6 flex flex-col items-center gap-4">
        <h2 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Chautara Courtyard
        </h2>

        <div className="bg-white p-1 rounded-full shadow-lg border flex gap-1">
          <Button
            size="sm"
            className="rounded-full"
            variant={mode === 'share' ? "default" : "ghost"}
            onClick={() => setMode('share')}
          >
            <PenTool className="h-3 w-3 mr-1" /> Share
          </Button>
          <Button
            size="sm"
            className="rounded-full"
            variant={mode === 'read' ? "default" : "ghost"}
            onClick={() => setMode('read')}
          >
            <BookOpen className="h-3 w-3 mr-1" /> Read
          </Button>
        </div>
      </div>

      {/* SHARE MODE */}
      {mode === 'share' ? (
        <Card className="p-6 space-y-4 shadow-xl border border-slate-100">

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share what’s on your mind..."
            className="w-full p-4 border rounded-xl resize-none focus:ring-2 focus:ring-primary outline-none"
          />

          <div className="flex gap-3">
            <Button
              onClick={startVoice}
              variant="outline"
              className="rounded-xl"
            >
              <Mic className="h-4 w-4" />
            </Button>

            <Button
              onClick={handlePost}
              className="flex-1 rounded-xl bg-primary hover:opacity-90"
            >
              <Send className="h-4 w-4 mr-2" />
              Share Story
            </Button>
          </div>

        </Card>
      ) : (

        /* READ MODE */
        <ScrollArea className="flex-1 pr-2">
          <div className="space-y-6 pb-4">

            {feed.map((story) => (
              <Card
                key={story.id}
                className="p-5 rounded-2xl shadow-md border border-slate-100 hover:shadow-lg transition"
              >

                {/* STORY */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <User className="h-4 w-4 text-primary" />
                  </div>

                  <p className="text-base leading-relaxed italic text-foreground/90">
                    {story.content}
                  </p>
                </div>

                {/* COMMENTS */}
                <div className="space-y-2 mb-3">
                  {story.replies?.map((r: any, i: number) => (
                    <div
                      key={i}
                      className="bg-slate-100 px-3 py-2 rounded-xl text-sm flex items-start gap-2"
                    >
                      <Flame className="h-3 w-3 mt-1 text-orange-400" />
                      <span>{r.content}</span>
                    </div>
                  ))}
                </div>

                {/* COMMENT INPUT */}
                <div className="flex gap-2 mt-3">
                  <input
                    value={commentInputs[story.id] || ""}
                    onChange={(e) =>
                      setCommentInputs(prev => ({
                        ...prev,
                        [story.id]: e.target.value
                      }))
                    }
                    placeholder="Send support..."
                    className="flex-1 border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                  />

                  <Button
                    size="icon"
                    onClick={() => handleManualComment(story.id)}
                    className="rounded-xl"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

              </Card>
            ))}

          </div>
        </ScrollArea>
      )}

      {/* FOOTER */}
      <div className="text-center text-xs mt-4 opacity-50 flex items-center justify-center gap-1">
        <ShieldCheck className="h-3 w-3" />
        Safe Sanctuary Space
      </div>
    </div>
  );
};

export default PeerConnect;