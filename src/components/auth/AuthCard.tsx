import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface AuthCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <Card className="w-full max-w-md mx-auto glass-card border-white/20 dark:border-white/5 rounded-2xl overflow-hidden">
      <CardHeader className="space-y-2 pb-8 pt-10">
        <CardTitle className="text-3xl font-extrabold tracking-tight text-center bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
          {title}
        </CardTitle>
        <CardDescription className="text-center text-muted-foreground/80 font-medium">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-8 pb-10">
        {children}
      </CardContent>
      {footer && (
        <CardFooter className="flex justify-center border-t border-border/40 bg-muted/30 py-4 px-8">
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}
