import {RouteLoadingStripe} from "@/app/components/route-loading-stripe";
import { LoadingMessage } from "@/app/components/loading-message";

// RootLoading covers routes that do not provide a more specific loading state.
export default function RootLoading() {
  return (
    <>
      <RouteLoadingStripe />
      <div className="mx-auto w-full max-w-7xl px-4 pt-8">
        <LoadingMessage message="Getting things ready..." />
      </div>
    </>
  );
}
