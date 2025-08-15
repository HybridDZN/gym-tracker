import React, { useEffect, useState } from "react";
import supabase from "@/supabase";
import ReactApexChart from "react-apexcharts";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

type ExerciseChartSelectorProps = {
  onChange: (value: string) => void;
  selected: string;
  options: { value: string; label: string }[];
  label: string;
};

export function ExerciseChartSelector({ onChange, selected, options, label }: ExerciseChartSelectorProps) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="font-medium">{label}:</span>
      <Select value={selected} onValueChange={onChange}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

type ExerciseProgressChartProps = {
  exerciseId: string;
  chartType: "line" | "bar" | "area";
  timeRange: string; // New prop for time range
};

type WorkoutData = {
  created_time: string;
  weight: number;
  exercise_id: string;
};

export function ExerciseProgressChart({ exerciseId, chartType, timeRange }: ExerciseProgressChartProps) {
  const [data, setData] = useState<WorkoutData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const to = new Date();
      const from = new Date();
      from.setDate(to.getDate() - parseInt(timeRange, 10));

      const { data, error } = await supabase
        .from("workouts")
        .select("created_time, weight, exercise_id")
        .eq("exercise_id", exerciseId)
        .gte("created_time", from.toISOString()) // Filter based on timeRange
        .lte("created_time", to.toISOString()) // Ensure data up to current date
        .order("created_time", { ascending: true });
      if (!error && data) {
        setData(data);
        console.log("Fetched data:", data); // Debugging log
      }
      setLoading(false);
    }
    if (exerciseId) fetchData();
  }, [exerciseId, timeRange]); // Add timeRange to dependency array

  const series = [
    {
      name: "Weight",
      data: data.map((d) => ({ x: d.created_time, y: d.weight })), // Revert to original x-axis data for datetime type
    },
  ];

  const options = {
    chart: { id: "progress-chart", type: chartType },
    xaxis: {
      type: "datetime",
      title: { text: "Date" },
      labels: {
        formatter: function (val: string) {
          return new Date(val).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
        },
      },
    },
    yaxis: { title: { text: "Value" } },
    stroke: { curve: "smooth" } as const,
    legend: { show: true },
  } as const;

  console.log("Series data:", series); // Debugging log

  if (loading) return <div>Loading chart...</div>;
  return (
    <div>
      <ReactApexChart options={options} series={series} type={chartType} height={350} />
    </div>
  );
}
