import {
  forwardRef,
  InputHTMLAttributes,
  ReactNode,
  LabelHTMLAttributes,
} from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean;
};

export const Label = ({
  className = "",
  children,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement> & {
  className?: string;
  children: ReactNode;
}) => {
  return (
    <label
      className={`block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 ${className}`}
      {...props}
    >
      {children}
    </label>
  );
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", error, ...props }, ref) => {
    const baseStyles =
      "w-full px-3 py-2.5 bg-background border rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all placeholder:text-muted-foreground/60";
    const normalStyles = "border-input";
    const errorStyles = "border-destructive bg-destructive/5";

    return (
      <input
        ref={ref}
        className={`${baseStyles} ${error ? errorStyles : normalStyles} ${className}`}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
