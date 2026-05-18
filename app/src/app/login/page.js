import LoginForm from "./LoginForm";

export default function LoginPage({ searchParams }) {
  const raw = typeof searchParams?.callbackUrl === "string" ? searchParams.callbackUrl : null;
  const callbackUrl = raw && raw.startsWith("/") ? raw : "/dashboard/employee";
  return <LoginForm callbackUrl={callbackUrl} />;
}
