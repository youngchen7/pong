import { Button as SBButton } from "@supabase/ui";

export function Button(props: Partial<Parameters<typeof SBButton>>) {
  return <Button {...props} />;
}
