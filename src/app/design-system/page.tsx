'use client';

// Dev-only design-system demo. Exercises every primitive in DESIGN.md so we
// can eyeball the system as a whole. Not linked from any public page.

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Briefcase,
  Camera,
  Coins,
  DollarSign,
  Eye,
  Mail,
  Plus,
  Sparkles,
  Star,
  TrendingUp,
} from 'lucide-react';
import {
  Avatar,
  AvatarStack,
  Badge,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardLink,
  CardTitle,
  Checkbox,
  Counter,
  EmptyState,
  IconButton,
  Input,
  LinkButton,
  Modal,
  ModalFooter,
  ProductBadge,
  ProgressRing,
  Select,
  Sheet,
  Skeleton,
  SkeletonText,
  StatCard,
  Surface,
  Switch,
  Textarea,
  ToastProvider,
  toast,
} from '@/components/ui';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

const PRODUCTS = ['insights', 'abtest', 'promote', 'collab', 'boost'] as const;

export default function DesignSystemPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  return (
    <ToastProvider>
      <div className="min-h-dvh bg-bg text-fg">
        {/* Top bar */}
        <header className="sticky top-0 z-10 border-b border-border bg-bg-elevated/80 backdrop-blur">
          <div className="mx-auto max-w-[1280px] flex items-center gap-4 px-6 h-14">
            <span className="font-semibold text-fg">Highzcore — Design System</span>
            <span className="text-xs text-fg-muted hidden md:inline">M2 — primitives + shells</span>
            <div className="ml-auto"><ThemeToggle /></div>
          </div>
        </header>

        <main className="mx-auto max-w-[1280px] px-6 py-12 space-y-16">
          {/* Type scale */}
          <Section title="Typography" description="Inter, optical sizing on, tight tracking on display sizes.">
            <Surface bordered className="p-8 space-y-4">
              <h1 className="font-display text-7xl md:text-[128px] font-extrabold tracking-[-0.04em] leading-[1]">
                Real audiences.
              </h1>
              <h2 className="font-display text-5xl md:text-7xl font-bold tracking-[-0.03em]">
                Honest data.
              </h2>
              <h3 className="text-3xl font-semibold tracking-tight">
                Title large — section heads
              </h3>
              <h4 className="text-xl font-semibold">Title medium — card heads</h4>
              <p className="text-lg text-fg-muted leading-relaxed">
                Body large — lede paragraphs and marketing body. Slightly bigger and breathier than
                default body, used at the top of long-form sections.
              </p>
              <p className="text-base text-fg leading-relaxed">
                Body medium — the default. Used for almost everything below a title.
              </p>
              <p className="text-sm text-fg-muted leading-relaxed">Body small — secondary text.</p>
              <p className="text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle">
                OVERLINE EYEBROW
              </p>
              <p className="font-mono text-base tabular text-fg">
                $12,345.6700 — JetBrains Mono, tabular figures
              </p>
            </Surface>
          </Section>

          {/* Color tokens */}
          <Section title="Color" description="Semantic tokens auto-swap between light + dark. Hover the swatches for the raw value.">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Swatch token="bg"             className="bg-bg" />
              <Swatch token="surface"        className="bg-surface" />
              <Swatch token="surface-raised" className="bg-surface-raised" />
              <Swatch token="surface-active" className="bg-surface-active" />
              <Swatch token="border"         className="bg-border" />
              <Swatch token="fg"             className="bg-fg" />
              <Swatch token="brand"          className="bg-brand" />
              <Swatch token="brand-tint"     className="bg-brand-tint" />
              <Swatch token="success"        className="bg-success" />
              <Swatch token="warning"        className="bg-warning" />
              <Swatch token="danger"         className="bg-danger" />
              <Swatch token="info"           className="bg-info" />
            </div>
          </Section>

          {/* Product badges */}
          <Section title="Product badges" description="One canonical icon + accent color per product.">
            <Surface bordered className="p-8 grid grid-cols-2 md:grid-cols-5 gap-6">
              {PRODUCTS.map((p) => (
                <div key={p} className="flex flex-col items-center gap-2">
                  <ProductBadge product={p} size="xl" />
                  <span className="text-xs font-medium text-fg-muted capitalize">{p}</span>
                </div>
              ))}
            </Surface>
          </Section>

          {/* Buttons */}
          <Section title="Buttons" description="Three variants × three sizes. Plus icon-only and link variants.">
            <Surface bordered className="p-8 space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
                <Button disabled>Disabled</Button>
                <Button loading>Loading</Button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>Small</Button>
                <Button size="md" leftIcon={<Plus className="h-4 w-4" />}>Medium</Button>
                <Button size="lg" leftIcon={<Plus className="h-4 w-4" />} rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Large
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <IconButton ariaLabel="Add" icon={<Plus className="h-4 w-4" />} />
                <IconButton ariaLabel="Add" icon={<Plus className="h-4 w-4" />} variant="secondary" />
                <LinkButton href="#" variant="secondary" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Link button
                </LinkButton>
              </div>
            </Surface>
          </Section>

          {/* Cards */}
          <Section title="Cards" description="Three variants. Interactive cards lift 2px on hover.">
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <div>
                    <CardTitle>Resting card</CardTitle>
                    <CardDescription>Default content block. Bordered + shadow-1.</CardDescription>
                  </div>
                </CardHeader>
                <p className="text-sm text-fg-muted">Body content goes here.</p>
              </Card>
              <Card variant="interactive">
                <CardHeader>
                  <div>
                    <CardTitle>Interactive card</CardTitle>
                    <CardDescription>Lifts on hover. Use for clickable lists.</CardDescription>
                  </div>
                </CardHeader>
                <p className="text-sm text-fg-muted">Hover me.</p>
              </Card>
              <CardLink href="#">
                <CardHeader>
                  <div>
                    <CardTitle>Card-as-link</CardTitle>
                    <CardDescription>Renders a Link wrapper with hover lift.</CardDescription>
                  </div>
                </CardHeader>
                <p className="text-sm text-fg-muted">Whole card is clickable.</p>
              </CardLink>
            </div>
          </Section>

          {/* Badges */}
          <Section title="Badges" description="Six tones × three styles × three sizes.">
            <Surface bordered className="p-8 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="neutral">Neutral</Badge>
                <Badge tone="brand">Brand</Badge>
                <Badge tone="success" leftIcon={<Sparkles className="h-3 w-3" />}>Live</Badge>
                <Badge tone="warning">Pending</Badge>
                <Badge tone="danger">Failed</Badge>
                <Badge tone="info">Info</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="brand" variant="solid">Solid</Badge>
                <Badge tone="brand" variant="outline">Outline</Badge>
                <Badge tone="brand" variant="soft" size="xs">Tiny</Badge>
                <Badge tone="brand" variant="soft" size="md">Big</Badge>
              </div>
            </Surface>
          </Section>

          {/* Avatars */}
          <Section title="Avatars" description="Image with initials fallback. Stacks for multi-person contexts.">
            <Surface bordered className="p-8 flex flex-wrap items-end gap-6">
              <Avatar name="Ada Lovelace" size="xs" />
              <Avatar name="Ada Lovelace" size="sm" />
              <Avatar name="Ada Lovelace" size="md" />
              <Avatar name="Ada Lovelace" size="lg" />
              <Avatar name="Ada Lovelace" size="xl" />
              <Avatar name="Ada Lovelace" size="2xl" />
              <AvatarStack
                size="md"
                people={[
                  { name: 'Ada Lovelace' },
                  { name: 'Grace Hopper' },
                  { name: 'Linus Torvalds' },
                  { name: 'Dennis Ritchie' },
                  { name: 'Margaret Hamilton' },
                  { name: 'Donald Knuth' },
                ]}
              />
            </Surface>
          </Section>

          {/* Forms */}
          <Section title="Forms" description="Inputs, textarea, select, checkbox, switch — same focus + error styling.">
            <Surface bordered className="p-8 grid md:grid-cols-2 gap-6">
              <Input
                label="Channel URL"
                placeholder="https://youtube.com/@yourname"
                helper="Paste your channel link — we'll detect the rest."
                leftIcon={<Camera className="h-4 w-4" />}
                required
              />
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                leftIcon={<Mail className="h-4 w-4" />}
                error="Looks like that email isn't valid."
              />
              <Select
                label="Country"
                placeholder="Select a country"
                options={[
                  { value: 'NG', label: 'Nigeria' },
                  { value: 'IN', label: 'India' },
                  { value: 'ID', label: 'Indonesia' },
                  { value: 'MY', label: 'Malaysia' },
                  { value: 'SG', label: 'Singapore' },
                  { value: 'GH', label: 'Ghana' },
                ]}
              />
              <Textarea label="Tell us about your channel" placeholder="What do you make? Who's it for?" rows={3} />
              <Checkbox label="I agree to the Terms of Service" description="You can read them in the footer." />
              <Switch label="Email notifications" description="Daily digest of study responses." defaultChecked />
            </Surface>
          </Section>

          {/* Data display */}
          <Section title="Data display" description="Stat cards, counters, progress rings, skeletons, empty states.">
            <div className="grid md:grid-cols-4 gap-4">
              <StatCard label="Active studies"   value={12}   delta={8.4}   icon={<Briefcase className="h-4 w-4" />} trendHint="vs. last week" />
              <StatCard label="Responses today"  value={487}  delta={-2.1}  icon={<Eye className="h-4 w-4" />} accent="var(--c-product-insights)" />
              <StatCard label="Pending payout"   value={1248.5} decimals={2} prefix="$" icon={<DollarSign className="h-4 w-4" />} />
              <StatCard label="Lifetime earned"  value={9856} prefix="$" delta={142.5} trendHint="all time" icon={<TrendingUp className="h-4 w-4" />} />
            </div>
            <div className="mt-6 grid md:grid-cols-3 gap-6">
              <Card>
                <p className="text-sm font-medium text-fg-muted mb-3">Progress rings</p>
                <div className="flex flex-wrap items-center gap-6">
                  <ProgressRing value={0.32} label="32%" />
                  <ProgressRing value={0.7} label="70%" color="var(--c-product-promote)" />
                  <ProgressRing value={0.92} label="92%" color="var(--c-product-collab)" size={96} strokeWidth={8} />
                </div>
              </Card>
              <Card>
                <p className="text-sm font-medium text-fg-muted mb-3">Counter</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-semibold tabular"><Counter value={12450} prefix="$" /></span>
                  <span className="text-xs text-success font-semibold">+12.4%</span>
                </div>
                <p className="mt-1 text-xs text-fg-muted">Animates on viewport entry.</p>
              </Card>
              <Card>
                <p className="text-sm font-medium text-fg-muted mb-3">Skeletons</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton shape="circle" className="h-10 w-10" />
                    <div className="flex-1">
                      <SkeletonText lines={2} />
                    </div>
                  </div>
                  <Skeleton className="h-24 w-full" />
                </div>
              </Card>
            </div>
            <div className="mt-6">
              <Card padding="md">
                <EmptyState
                  icon={<Star className="h-7 w-7" strokeWidth={1.5} />}
                  title="No studies yet"
                  description="Once you create your first study, your responses and reports will appear here."
                  action={<Button leftIcon={<Plus className="h-4 w-4" />}>Create your first study</Button>}
                />
              </Card>
            </div>
          </Section>

          {/* Overlays + toasts */}
          <Section title="Overlays" description="Modals (desktop) and sheets (mobile). Toasts at top-right.">
            <Surface bordered className="p-8 flex flex-wrap items-center gap-3">
              <Button variant="secondary" onClick={() => setModalOpen(true)}>Open modal</Button>
              <Button variant="secondary" onClick={() => setSheetOpen(true)}>Open sheet</Button>
              <Button variant="ghost" onClick={() => toast.success('Saved', 'Your changes are live.')}>Success toast</Button>
              <Button variant="ghost" onClick={() => toast.error('Failed', 'Something went wrong, try again.')}>Error toast</Button>
              <Button variant="ghost" onClick={() => toast.info('Heads up', 'Your study is filling fast.')}>Info toast</Button>
              <Button variant="ghost" onClick={() => toast.warning('Note', 'You haven\'t verified your channel yet.')}>Warning toast</Button>
            </Surface>
            <AnimatePresence>
              {modalOpen && (
                <Modal
                  open={modalOpen}
                  onClose={() => setModalOpen(false)}
                  title="Ready to launch?"
                  description="Once you publish, workers in your target audience can start claiming the study within 30 minutes."
                >
                  <div className="space-y-4">
                    <Card padding="sm" variant="plain" className="bg-surface-hover">
                      <div className="flex items-center gap-3">
                        <Coins className="h-4 w-4 text-fg-muted" />
                        <span className="text-sm text-fg">Cost: <span className="font-semibold tabular">$150.00</span></span>
                      </div>
                    </Card>
                    <p className="text-sm text-fg-muted leading-relaxed">
                      We hold the cost in escrow. Workers are paid as their responses are approved.
                    </p>
                  </div>
                  <ModalFooter>
                    <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
                    <Button onClick={() => setModalOpen(false)}>Launch study</Button>
                  </ModalFooter>
                </Modal>
              )}
              {sheetOpen && (
                <Sheet
                  open={sheetOpen}
                  onClose={() => setSheetOpen(false)}
                  title="Pick a product"
                  description="What kind of help does your channel need today?"
                >
                  <div className="grid grid-cols-1 gap-3 pt-2">
                    {PRODUCTS.map((p) => (
                      <button
                        key={p}
                        onClick={() => setSheetOpen(false)}
                        className="flex items-center gap-3 p-3 rounded-md bg-surface hover:bg-surface-hover text-left"
                      >
                        <ProductBadge product={p} size="md" />
                        <span className="font-medium text-fg capitalize">{p}</span>
                      </button>
                    ))}
                  </div>
                </Sheet>
              )}
            </AnimatePresence>
          </Section>

          {/* Elevation */}
          <Section title="Elevation" description="4 levels. Light mode uses shadow; dark uses inset stroke + soft drop.">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[0, 1, 2, 3].map((n) => (
                <Surface
                  key={n}
                  tone="elevated"
                  elevation={n as 0 | 1 | 2 | 3}
                  bordered
                  className="h-32 flex items-center justify-center text-sm text-fg-muted"
                >
                  shadow-elev-{n}
                </Surface>
              ))}
            </div>
          </Section>

          <footer className="pt-12 pb-24 border-t border-border text-xs text-fg-subtle text-center">
            Highzcore design system — v0 (M2)
          </footer>
        </main>
      </div>
    </ToastProvider>
  );
}

// ── helpers ────────────────────────────────────────────────────────────────

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle">M2</p>
        <h2 className="text-3xl font-semibold tracking-tight">{title}</h2>
        {description && <p className="text-sm text-fg-muted max-w-2xl">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function Swatch({ token, className }: { token: string; className: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className={`${className} h-20 rounded-md border border-border`} />
      <span className="font-mono text-xs text-fg-muted">{token}</span>
    </div>
  );
}
