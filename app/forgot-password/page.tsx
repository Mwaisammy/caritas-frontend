import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ForgotPassword = () => {
  return (
    <div className=" min-h-screen ">
      <div className="flex flex-col top-80 fixed left-0 right-0 justify-center items-center  w-full max-w-md mx-auto gap-y-4 p-4 ">
        <h1 className="text-sm md:text-xl">
          Enter your email address to reset password
        </h1>

        <div className="flex  flex-col md:flex-row gap-y-4 md:gap-x-4 w-full">
          <Input
            placeholder="Enter your email address"
            className="text-xs md:text-sm"
          />

          <Button className="text-xs w-full md:w-fit bg-rose-900 hover:bg-rose-800">
            Verify
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
