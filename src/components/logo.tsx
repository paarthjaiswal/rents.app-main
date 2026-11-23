import Image from "next/image";

export const Logo = ({
  height,
  width,
  className,
}: {
  height: number;
  width: number;
  className?: string;
}) => {
  return (
    <Image
      className={`cursor-pointer select-none ${className || ""}`}
      src="/rents.app_final_logo.png"
      width={width}
      height={height}
      alt="rents.app logo"
      priority
    />
  );
};

export default Logo;
