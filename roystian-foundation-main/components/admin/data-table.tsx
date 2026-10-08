"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/states";
import { EASE, STAGGER } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  /** Cell content for the desktop table and mobile card. */
  render: (row: T) => React.ReactNode;
  className?: string;
  /** Show this value as the card title on mobile instead of a labelled row. */
  primary?: boolean;
  /** Hide from the mobile card entirely. */
  hideOnMobile?: boolean;
  align?: "left" | "right";
}

/**
 * Responsive data table: a real table on desktop, stacked cards below `md`.
 */
export function DataTable<T>({
  columns,
  rows,
  getKey,
  emptyTitle = "Nothing to show",
  emptyDescription = "There are no records matching the current filters.",
  className,
}: {
  columns: Column<T>[];
  rows: T[];
  getKey: (row: T) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}) {
  const reduce = useReducedMotion();

  /** Rows arrive in sequence when a filter changes; the stagger is capped so
   *  a long result set never feels slow. */
  const enter = (index: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 6 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0 },
          transition: {
            duration: 0.25,
            delay: Math.min(index, 10) * STAGGER.tight * 0.5,
            ease: EASE,
          },
        };

  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  const primary = columns.find((column) => column.primary) ?? columns[0];
  const secondary = columns.filter(
    (column) => column !== primary && !column.hideOnMobile,
  );

  return (
    <div className={cn("space-y-3", className)}>
      {/* Desktop */}
      <div className="hidden rounded-2xl border border-border bg-card shadow-soft md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(column.align === "right" && "text-right", column.className)}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence initial={false}>
            {rows.map((row, index) => (
              <motion.tr
                key={getKey(row)}
                {...enter(index)}
                className="border-b border-border transition-colors last:border-0 hover:bg-muted/40 data-[state=selected]:bg-muted"
              >
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    className={cn(column.align === "right" && "text-right", column.className)}
                  >
                    {column.render(row)}
                  </TableCell>
                ))}
              </motion.tr>
            ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      {/* Mobile */}
      <ul className="space-y-3 md:hidden">
        <AnimatePresence initial={false}>
        {rows.map((row, index) => (
          <motion.li
            key={getKey(row)}
            {...enter(index)}
            className="rounded-2xl border border-border bg-card p-4 shadow-soft"
          >
            <div className="text-sm font-semibold text-foreground">
              {primary.render(row)}
            </div>
            <dl className="mt-3 space-y-2 border-t border-border pt-3">
              {secondary.map((column) => (
                <div
                  key={column.key}
                  className="flex items-start justify-between gap-4 text-sm"
                >
                  <dt className="shrink-0 text-xs text-muted-foreground">
                    {column.header}
                  </dt>
                  <dd className="min-w-0 text-right text-foreground">
                    {column.render(row)}
                  </dd>
                </div>
              ))}
            </dl>
          </motion.li>
        ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
