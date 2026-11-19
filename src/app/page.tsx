import { connection } from "next/server";
import { Welcome } from "../booth/Welcome";

export default async function Home({ searchParams }: PageProps<"/">) {
  if (process.env.NODE_ENV === "development" && (await searchParams).buttons === "1") {
    const { ButtonShowcase } = await import("../dev/ButtonShowcase");
    return <ButtonShowcase />;
  }
  if (process.env.NODE_ENV === "development" && (await searchParams).simulator === "1") {
    const { Simulator } = await import("../dev/Simulator");
    return <div className="simulator"><Simulator /></div>;
  }
  await connection();
  const idle = Number(process.env.BOOTH_THANK_YOU_SECONDS);
  return <Welcome thankYouSeconds={Number.isInteger(idle) && idle >= 1 && idle <= 120 ? idle : undefined} />;
}
