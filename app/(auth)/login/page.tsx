import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Login = () => {
  return (
    <div className="">
      <div className="flex flex-col justify-center    overflow-hidden w-full max-w-md mx-auto p-4 ">
        <div className="text-center">
          <h2 className="text-lg md:text-4xl font-bold">Welcome</h2>

          <p className="text-sm md:text-xl">Please enter your login details</p>
        </div>

        <div className="flex flex-col gap-4 mt-6">
          <div>
            <label className="text-gray-600 text-sm" htmlFor="">
              Email Address
            </label>
            <Input
              className="py-4"
              type="email"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <span className="flex align-middle justify-between">
              <label className="text-gray-600 text-sm" htmlFor="">
                Password
              </label>

              <a href="/forgot-paasword" className="hover:text-blue-500 hover:">
                Forgot password?
              </a>
            </span>
            <Input
              className="py-4"
              type="password"
              placeholder="Enter your password"
            />
          </div>
        </div>

        <div className="flex justify-center mt-4">
          <Button className="w-full cursor-pointer bg-rose-800 text-white hover:bg-rose-900">
            {" "}
            Login
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Login;
