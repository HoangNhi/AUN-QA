"use client";

import * as React from "react";
import { ChevronDownIcon } from "lucide-react";

import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./Button";
import { format } from "date-fns";

export function DatePicker({
  optionLabel,
  value,
  onChange,
  className,
}: {
  optionLabel?: string;
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between font-normal"
          >
            {value ? format(value, "dd/MM/yyyy") : optionLabel}
            <ChevronDownIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            defaultMonth={value}
            captionLayout="dropdown"
            onSelect={(date) => {
              setOpen(false);
              onChange(date);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
