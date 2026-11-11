import { Card, CardContent } from "@components";
import { PageHeader } from "@/components/page-header";
import { TEXTS } from "@/texts";

export default function SettingsPage() {
  return (
    <>
      <PageHeader title={TEXTS.settings.title} subtitle={TEXTS.settings.subtitle} />
      <Card>
        <CardContent className="text-muted-foreground py-10 text-center text-sm">
          {TEXTS.settings.subtitle}
        </CardContent>
      </Card>
    </>
  );
}
