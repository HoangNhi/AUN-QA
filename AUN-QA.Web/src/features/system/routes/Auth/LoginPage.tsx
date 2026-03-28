import { GalleryVerticalEnd } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
  username: z.string().min(1, "Vui lòng nhập tên Đăng nhập"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

const LoginPage = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const result = await login(values.username, values.password);
      if (!result.Success) {
        toast.error(result.Message || "Đăng nhập thất bại");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Đăng nhập thất bại");
    }
  };

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-4" />
            </div>
            AUN-QA
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <Form {...form}>
              <form
                className="flex flex-col gap-6"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col items-center gap-1 text-center">
                    <h1 className="text-2xl font-bold">Login to your account</h1>
                    <p className="text-muted-foreground text-sm text-balance">
                      Enter your email below to login to your account
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên Đăng nhập</FormLabel>
                        <FormControl>
                          <Input placeholder="Tên Đăng nhập" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Mật khẩu</FormLabel>
                          <a
                            href="#"
                            className="text-sm underline-offset-4 hover:underline"
                          >
                            Quên mật khẩu?
                          </a>
                        </div>
                        <FormControl>
                          <Input type="password" placeholder="Mật khẩu" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full">
                    Đăng nhập
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <img
          src="/placeholder.svg"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
};

export default LoginPage;

