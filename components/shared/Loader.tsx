import React from "react";

export default function Loader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-gray-500">
      <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-xl font-bold">{message}</p>
    </div>
  );
}
