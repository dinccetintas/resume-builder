import Nav from "@/components/Nav";
import ProfileEditor from "@/components/ProfileEditor";
import ScreeningAnswersEditor from "@/components/ScreeningAnswersEditor";
import { getFullProfile, listScreeningAnswers } from "@/lib/ui-data";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const [{ configured: profileConfigured, profile }, { configured: answersConfigured, answers }] =
    await Promise.all([getFullProfile(), listScreeningAnswers()]);

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <header className="mb-6">
          <h1 className="font-serif text-3xl tracking-tight text-ink">Profile</h1>
          <p className="mt-1 text-muted">
            The &ldquo;fill once&rdquo; data reused to tailor and submit every application.
          </p>
        </header>

        <div className="space-y-8">
          <ProfileEditor initialProfile={profile} configured={profileConfigured} />
          <ScreeningAnswersEditor
            initialAnswers={answers}
            configured={answersConfigured}
          />
        </div>
      </main>
    </div>
  );
}
