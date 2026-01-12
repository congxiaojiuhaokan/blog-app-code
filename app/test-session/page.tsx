"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function TestSessionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  console.log("Session status:", status);
  console.log("Session data:", session);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (status === "unauthenticated") {
    return (
      <div>
        <p>Not signed in</p>
        <button onClick={() => signIn("credentials", { redirect: false })}>
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div>
      <p>Signed in as {session?.user?.email}</p>
      <button onClick={() => signOut()}>Sign out</button>
      <button onClick={() => router.push("/dashboard")}>Go to Dashboard</button>
    </div>
  );
}