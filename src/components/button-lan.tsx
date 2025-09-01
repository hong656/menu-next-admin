// components/button-lan.tsx
'use client';

import {useRouter} from 'next/navigation';
import {useLocale} from 'next-intl';
import {useTransition} from 'react';
import {setLocale} from '../app/action';

import {Button} from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {Languages, Check, Loader2} from 'lucide-react';

type Locale = 'en' | 'kh';

const LOCALES: {value: Locale; label: string;}[] = [
  {value: 'en', label: 'English'},
  {value: 'kh', label: 'ភាសាខ្មែរ'}
];

export default function LocaleSwitcher() {
  const router = useRouter();
  const current = useLocale() as Locale;
  const [pending, startTransition] = useTransition();

  function choose(l: Locale) {
    if (l === current || pending) return;
    startTransition(async () => {
      await setLocale(l);
      router.refresh();
    });
  }

  const active = LOCALES.find(x => x.value === current)!;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-3 gap-2" // aligns nicely with your header
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Languages className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">
            {active.label}
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>Language</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LOCALES.map(opt => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => choose(opt.value)}
            className="flex items-center justify-between"
            disabled={pending}
          >
            <span>{opt.label}</span>
            {current === opt.value && <Check className="h-4 w-4 opacity-70" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
