import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { BookOpen } from 'lucide-react';
import MannKoKura from '@/components/dashboard/MannKoKura';
import { PageHeader } from '@/components/layout/PageHeader';

const LegalRights = () => {
  const { t } = useLanguage();

  const [open, setOpen] = useState(false);
  const [selectedRight, setSelectedRight] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');

  const chatRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 🧠 Q&A DATABASE WITH DEFINITIONS
  const qaDB = {
    mental_health_access: {
      definition:
        'The right to mental healthcare means every person can access mental health services like counseling, therapy, and treatment. These services should be available, affordable, and provided without discrimination.',
      qa: [
        {
          questions: [
            'what is mental healthcare',
            'define mental healthcare',
            'right to mental healthcare meaning',
            'explain mental health rights',
          ],
          answer:
            'It means you have the right to access mental health services like counseling, therapy, and treatment without discrimination.',
        },
        {
          questions: [
            'free mental health treatment',
            'is therapy free',
            'cost of mental healthcare',
            'afford therapy',
          ],
          answer:
            'Basic mental health services are often free or low-cost in government hospitals and NGOs.',
        },
        {
          questions: [
            'where to go for mental help',
            'i feel depressed where to go',
            'mental health support',
            'need counseling help',
          ],
          answer:
            'You can visit government hospitals, mental health centers, NGOs, or contact helplines for support.',
        },
        {
          questions: [
            'can i go without family knowing',
            'private counseling',
            'confidential therapy',
          ],
          answer:
            'Yes, you have the right to seek mental health care privately without informing your family.',
        },
        {
          questions: [
            'can i stop treatment',
            'refuse therapy',
            'leave treatment',
          ],
          answer:
            'Yes, you have the right to consent to or refuse treatment at any time.',
        },
        {
          questions: [
            'suicidal thoughts help',
            'i feel like ending life',
            'urgent mental help',
          ],
          answer:
            'Please seek immediate help from a helpline, hospital, or trusted person. You are not alone and support is available.',
        },
      ],
    },

    mental_health_dignity: {
      definition:
        'The right to equality means all individuals are treated equally under the law without discrimination based on gender, caste, religion, identity, or background.',
      qa: [
        {
          questions: [
            'what is equality',
            'define equality',
            'equal rights meaning',
          ],
          answer:
            'Equality means everyone is treated fairly and equally under the law without discrimination.',
        },
        {
          questions: [
            'what is discrimination',
            'define discrimination',
            'unfair treatment meaning',
          ],
          answer:
            'Discrimination means treating someone unfairly because of their gender, caste, religion, or identity.',
        },
        {
          questions: [
            'treated unfairly at work',
            'workplace discrimination',
            'job inequality',
          ],
          answer:
            'You have the right to equal treatment at work. You can file a complaint or seek legal help.',
        },
        {
          questions: [
            'caste discrimination',
            'gender discrimination',
            'religion discrimination',
          ],
          answer:
            'Discrimination based on caste, gender, or religion is illegal and punishable.',
        },
        {
          questions: [
            'lgbt rights nepal',
            'are lgbt protected',
            'sexual identity rights',
          ],
          answer:
            'Yes, Nepal recognizes and protects LGBTQ+ rights under equality laws.',
        },
        {
          questions: [
            'family treats me unfairly',
            'unequal treatment at home',
          ],
          answer:
            'You can seek support or legal help if you are treated unfairly even within your family.',
        },
      ],
    },

    mental_health_privacy: {
      definition:
        'Confidentiality means your personal and medical information must be kept private and cannot be shared without your consent, except in legal or emergency situations.',
      qa: [
        {
          questions: [
            'what is confidentiality',
            'define confidentiality',
            'privacy meaning',
          ],
          answer:
            'Confidentiality means your personal and medical information must remain private.',
        },
        {
          questions: [
            'can doctor share my data',
            'doctor share records',
            'medical privacy',
          ],
          answer:
            'No, doctors cannot share your information without your permission unless required by law.',
        },
        {
          questions: [
            'family access records',
            'can parents see my data',
          ],
          answer:
            'No, your family cannot access your medical records without your consent.',
        },
        {
          questions: ['data leak what to do', 'privacy violation'],
          answer:
            'You can file a complaint and take legal action if your data is leaked.',
        },
        {
          questions: ['online counseling safe', 'is therapy private online'],
          answer:
            'Yes, trusted platforms ensure confidentiality and data protection.',
        },
        {
          questions: ['can i stay anonymous', 'anonymous help'],
          answer:
            'Yes, many services allow you to seek help anonymously.',
        },
      ],
    },

    dv_report: {
      definition:
        'Domestic violence includes physical, emotional, sexual, or economic abuse within a household or relationship.',
      qa: [
        {
          questions: [
            'what is domestic violence',
            'define abuse at home',
          ],
          answer:
            'Domestic violence includes physical, emotional, sexual, or economic abuse within a household.',
        },
        {
          questions: [
            'how to report abuse',
            'where report domestic violence',
            'file complaint abuse',
          ],
          answer:
            'You can report domestic violence at any police station.',
        },
        {
          questions: [
            'emotional abuse valid',
            'no physical injury abuse',
          ],
          answer:
            'Yes, emotional and non-physical abuse are also recognized under the law.',
        },
        {
          questions: ['proof required', 'evidence needed'],
          answer:
            'Evidence like messages or photos helps, but you can still file a complaint without it.',
        },
        {
          questions: ['someone else report', 'can friend report'],
          answer:
            'Yes, someone else can report on your behalf.',
        },
        {
          questions: ['after complaint what happens', 'police action after report'],
          answer:
            'Police may investigate and take legal action to protect you.',
        },
      ],
    },

    dv_protection: {
      definition:
        'A protection order is a legal order issued by a court to prevent an abuser from contacting or harming the victim.',
      qa: [
        {
          questions: [
            'what is protection order',
            'restraining order meaning',
          ],
          answer:
            'It is a legal order that prevents the abuser from contacting or harming you.',
        },
        {
          questions: ['how to apply protection order', 'get court protection'],
          answer: 'You can apply for a protection order through the court.',
        },
        {
          questions: ['need lawyer protection order'],
          answer:
            'A lawyer is not required, and free legal aid is available.',
        },
        {
          questions: ['violate protection order'],
          answer:
            'If violated, the abuser can face legal penalties or arrest.',
        },
        {
          questions: ['immediate protection'],
          answer:
            'Courts can issue temporary protection quickly in urgent cases.',
        },
      ],
    },

    legal_aid: {
      definition:
        'Free legal aid means legal services are provided at no cost to people who cannot afford a lawyer.',
      qa: [
        {
          questions: ['what is legal aid', 'free lawyer meaning'],
          answer:
            'Legal aid provides free legal services to those who cannot afford a lawyer.',
        },
        {
          questions: ['who eligible legal aid', 'who gets free lawyer'],
          answer:
            'Low-income individuals and vulnerable groups are eligible.',
        },
        {
          questions: ['how apply legal aid', 'get free lawyer'],
          answer:
            'You can apply through legal aid offices or NGOs.',
        },
        {
          questions: ['legal aid domestic violence'],
          answer:
            'Yes, domestic violence victims can receive free legal support.',
        },
        {
          questions: ['documents needed legal aid'],
          answer:
            'Basic identification and proof of income may be required.',
        },
      ],
    },
  };

  // 🧠 RESPONSE ENGINE
  const getBotResponse = (query: string, right: any) => {
    if (!right) return 'Please select a legal topic first.';

    const q = query.toLowerCase();
    const data = qaDB[right.context];

    for (const item of data.qa) {
      if (item.questions.some((ques) => q.includes(ques))) {
        return `${item.answer} (Legal Basis: ${right.law})`;
      }
    }

    if (q.includes('what is') || q.includes('define')) {
      return `${data.definition} (Legal Basis: ${right.law})`;
    }

    let bestMatch = null;
    let maxScore = 0;

    for (const item of data.qa) {
      let score = 0;
      for (const word of item.questions.join(' ').split(' ')) {
        if (q.includes(word)) score++;
      }
      if (score > maxScore) {
        maxScore = score;
        bestMatch = item;
      }
    }

    if (bestMatch) {
      return `${bestMatch.answer} (Legal Basis: ${right.law})`;
    }

    return `${data.definition} (Legal Basis: ${right.law})`;
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg = { role: 'user', text: input };
    const botMsg = { role: 'bot', text: getBotResponse(input, selectedRight) };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput('');
  };

  const handleCardClick = (right: any) => {
    setSelectedRight(right);
    setMessages([
      { role: 'bot', text: `You selected "${right.title}". Ask your question.` },
    ]);
    setOpen(true);
  };

  const rights = [
    {
      title: 'Right to Mental Healthcare',
      desc: 'Access mental health services in Nepal.',
      law: 'Article 35 of Constitution of Nepal',
      context: 'mental_health_access',
    },
    {
      title: 'Right to Equality',
      desc: 'Equal protection and no discrimination.',
      law: 'Article 18 of Constitution of Nepal',
      context: 'mental_health_dignity',
    },
    {
      title: 'Right to Confidentiality',
      desc: 'Your mental health data must remain private.',
      law: 'Public Health Service Act 2018',
      context: 'mental_health_privacy',
    },
    {
      title: 'File Domestic Violence Complaint',
      desc: 'Report abuse at any police station.',
      law: 'Domestic Violence Act 2066',
      context: 'dv_report',
    },
    {
      title: 'Protection Order',
      desc: 'Court protection from abuser.',
      law: 'Domestic Violence Act 2066',
      context: 'dv_protection',
    },
    {
      title: 'Free Legal Aid',
      desc: 'Free lawyer support if needed.',
      law: 'Legal Aid Act 2054',
      context: 'legal_aid',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="border-b border-border/60 pb-10">
        <MannKoKura variant="embedded" />
      </div>

      <PageHeader
        eyebrow={t('Legal', 'कानुनी')}
        title={t('Know Your Rights', 'आफ्ना अधिकार जान्नुहोस्')}
        description={t(
          'In plain language, not legal jargon. Knowledge is power.',
          'सरल भाषामा, कानुनी शब्दावली होइन। ज्ञान शक्ति हो।'
        )}
      />

      <div className="space-y-4">
        {rights.map((right, i) => (
          <Card
            key={i}
            onClick={() => handleCardClick(right)}
            className="cursor-pointer rounded-2xl border-border/50 shadow-sm transition-shadow hover:shadow-md"
          >
            <CardContent className="p-5 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-sage-light flex items-center justify-center mt-0.5">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">{right.title}</h3>
                <p className="text-sm text-muted-foreground">{right.desc}</p>
                <p className="text-xs text-primary mt-2">{right.law}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedRight?.title}</DialogTitle>
          </DialogHeader>

          <div className="h-64 overflow-y-auto space-y-3 border p-3 bg-muted/30 rounded-lg">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow-sm break-words ${
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-br-md'
                      : 'bg-white text-gray-800 border rounded-bl-md'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={chatRef} />
          </div>

          <div className="flex gap-2 mt-3">
            <Input
              placeholder="Ask your question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <Button onClick={handleSend}>Send</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LegalRights;