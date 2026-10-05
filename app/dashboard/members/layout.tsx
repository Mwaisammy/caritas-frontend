import React from "react";

const MembersLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return <div className="min-w-0">{children}</div>;
};

export default MembersLayout;
