"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { registerSchema } from "@/schemas";
import { Loader2, Eye, EyeOff, Lock, User, GraduationCap, Building2, Mail, Phone, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      schoolName: "",
      slug: "",
      email: "",
      phone: "",
      address: "",
      adminUsername: "",
      adminPassword: "",
      adminFullName: "",
    },
  });

  const schoolName = watch("schoolName");

  async function onSubmit(data: RegisterFormData) {
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        toast({
          title: "Registration Failed",
          description: result.error || "Something went wrong. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setIsSuccess(true);
      toast({
        title: "Registration Successful",
        description: "Your madrasah has been created. You can now sign in.",
      });
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
            <GraduationCap className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="font-amiri text-2xl">Registration Complete</CardTitle>
          <CardDescription>
            Your madrasah has been created successfully. You can now sign in with your admin credentials.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => router.push("/login")}>
            Go to Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <GraduationCap className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="font-amiri text-3xl">
          Register Your Madrasah
        </CardTitle>
        <CardDescription>
          Create a new account for your school
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="schoolName">School Name *</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="schoolName"
                type="text"
                placeholder="e.g. Al-Furqan Islamic School"
                className="pl-10"
                disabled={isLoading}
                {...register("schoolName")}
              />
            </div>
            {errors.schoolName && (
              <p className="text-sm text-destructive">{errors.schoolName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">School URL Slug *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">/</span>
              <Input
                id="slug"
                type="text"
                placeholder="e.g. al-furqan"
                className="pl-7 lowercase"
                disabled={isLoading}
                {...register("slug")}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Your login URL will be: your-school-name.{typeof window !== "undefined" ? window.location.hostname : "vercel.app"}/login
            </p>
            {errors.slug && (
              <p className="text-sm text-destructive">{errors.slug.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="school@email.com"
                  className="pl-10"
                  disabled={isLoading}
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="phone"
                  type="text"
                  placeholder="+234..."
                  className="pl-10"
                  disabled={isLoading}
                  {...register("phone")}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="address"
                type="text"
                placeholder="School address"
                className="pl-10"
                disabled={isLoading}
                {...register("address")}
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="mb-3 text-sm font-medium text-foreground">Admin Account</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminFullName">Your Full Name *</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="adminFullName"
                type="text"
                placeholder="e.g. Abdullah Ibrahim"
                className="pl-10"
                disabled={isLoading}
                {...register("adminFullName")}
              />
            </div>
            {errors.adminFullName && (
              <p className="text-sm text-destructive">{errors.adminFullName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminUsername">Admin Username *</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="adminUsername"
                type="text"
                placeholder="Choose a username"
                className="pl-10"
                disabled={isLoading}
                {...register("adminUsername")}
              />
            </div>
            {errors.adminUsername && (
              <p className="text-sm text-destructive">{errors.adminUsername.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminPassword">Admin Password *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="adminPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                className="pl-10 pr-10"
                disabled={isLoading}
                {...register("adminPassword")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.adminPassword && (
              <p className="text-sm text-destructive">{errors.adminPassword.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              "Register Madrasah"
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign In
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
