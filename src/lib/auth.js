import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { prisma } from "./prisma";

const DEMO_USERS = {
  "employee@goalpulse.com": { name: "Demo Employee", role: "EMPLOYEE", department: "Sales" },
  "manager@goalpulse.com": { name: "Demo Manager", role: "MANAGER", department: "Sales" },
  "admin@goalpulse.com": { name: "Demo Admin", role: "ADMIN", department: "HR" },
};

export const authOptions = {
  // Enforce NEXTAUTH_SECRET in production. Fallback only for very basic local dev if needed, 
  // but better to throw if missing in a real app.
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "employee@goalpulse.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email.toLowerCase().trim();
        const password = credentials.password;

        const demoUser = DEMO_USERS[email];
        if (demoUser) {
          if (password !== "demo123") return null;

          const hashed = await bcrypt.hash("demo123", 10);
          let managerId;

          if (demoUser.role === "EMPLOYEE") {
            const manager = await prisma.employee.upsert({
              where: { email: "manager@goalpulse.com" },
              update: {
                name: DEMO_USERS["manager@goalpulse.com"].name,
                password: hashed,
                role: DEMO_USERS["manager@goalpulse.com"].role,
                department: DEMO_USERS["manager@goalpulse.com"].department,
              },
              create: {
                email: "manager@goalpulse.com",
                name: DEMO_USERS["manager@goalpulse.com"].name,
                password: hashed,
                role: DEMO_USERS["manager@goalpulse.com"].role,
                department: DEMO_USERS["manager@goalpulse.com"].department,
              },
            });
            managerId = manager.id;
          }

          const user = await prisma.employee.upsert({
            where: { email },
            update: {
              name: demoUser.name,
              password: hashed,
              role: demoUser.role,
              department: demoUser.department,
              ...(managerId ? { managerId } : {}),
            },
            create: {
              email,
              name: demoUser.name,
              password: hashed,
              role: demoUser.role,
              department: demoUser.department,
              ...(managerId ? { managerId } : {}),
            },
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            department: user.department,
          };
        }

        const user = await prisma.employee.findUnique({
          where: { email },
        });

        if (!user) return null;

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          department: user.department,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.department = user.department;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token?.id || token?.sub;
        session.user.role = token?.role;
        session.user.department = token?.department;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
};
