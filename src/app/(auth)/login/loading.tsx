import { LoadingScreen } from "@/components/shared/loading-screen";
import { Card, CardContent } from "@/components/ui/card";

export default function LoginLoading() {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-0">
        <LoadingScreen message="Carregando plataforma..." />
      </CardContent>
    </Card>
  );
}
