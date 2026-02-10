import { Card, CardContent, CardHeader, CardTitle } from "@registra/ui";
import { motion } from "motion/react";

interface MetricCardProps {
  label: string;
  value: string;
  delta: string;
  index: number;
}

export function MetricCard({ label, value, delta, index }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{label}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{value}</p>
          <p className="mt-2 text-sm text-muted-foreground">{delta}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
