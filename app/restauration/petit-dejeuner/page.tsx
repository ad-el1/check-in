import { getEventDay } from "@/lib/date";
import { MealList } from "@/components/meal-list";
import { RestaurationTabs } from "@/components/restauration-tabs";

export const dynamic = "force-dynamic";

export default function PetitDejeunerPage() {
  const day = getEventDay();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Petit-déjeuner — Jour {day}</h1>
        <p className="text-muted-foreground">
          Cochez chaque membre au moment de la distribution.
        </p>
      </div>
      <RestaurationTabs active="petit-dejeuner" />
      <MealList day={day} mealType="breakfast" />
    </div>
  );
}
