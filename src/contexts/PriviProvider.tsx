// components/PriviProvider.tsx
import { PrivyProvider } from "@privy-io/react-auth";
import { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export default function PriviProvider({ children }: Props) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID as string}
      config={{
        embeddedWallets: {
          createOnLogin: "all-users",
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
