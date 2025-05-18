// components/AnimatedCard.tsx
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

export default function AnimatedCard({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const { ref, inView } = useInView({
    triggerOnce: false,
    threshold: 0.2,
  });

  return (
    <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay }}
          className="bg-white rounded shadow p-4 m-4"
          style={{ margin: "1rem" }}
    >
      {children}
    </motion.div>
  );
}
