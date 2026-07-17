import { lazy, Suspense } from "react";
import { HeroSection } from "./home/HeroSection.js";

const FeaturedStaysSection = lazy(() =>
  import("./home/FeaturedStaysSection.js").then((m) => ({ default: m.FeaturedStaysSection })),
);
const HowItWorksSection = lazy(() =>
  import("./home/HowItWorksSection.js").then((m) => ({ default: m.HowItWorksSection })),
);
const CoLivingSection = lazy(() =>
  import("./home/CoLivingSection.js").then((m) => ({ default: m.CoLivingSection })),
);
const WorkspaceSection = lazy(() =>
  import("./home/WorkspaceSection.js").then((m) => ({ default: m.WorkspaceSection })),
);
const LocationsSection = lazy(() =>
  import("./home/LocationsSection.js").then((m) => ({ default: m.LocationsSection })),
);
const StatsSection = lazy(() =>
  import("./home/StatsSection.js").then((m) => ({ default: m.StatsSection })),
);
const TestimonialSection = lazy(() =>
  import("./home/TestimonialSection.js").then((m) => ({ default: m.TestimonialSection })),
);
const CtaBandSection = lazy(() =>
  import("./home/CtaBandSection.js").then((m) => ({ default: m.CtaBandSection })),
);
const HomeFooter = lazy(() =>
  import("./home/HomeFooter.js").then((m) => ({ default: m.HomeFooter })),
);

function SectionSkeleton({ minHeight }: { minHeight: string }) {
  return <div style={{ minHeight }} aria-hidden />;
}

export function HomePage() {
  return (
    <div className="w-full">
      <HeroSection />

      <Suspense fallback={<SectionSkeleton minHeight="480px" />}>
        <FeaturedStaysSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton minHeight="380px" />}>
        <HowItWorksSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton minHeight="480px" />}>
        <CoLivingSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton minHeight="480px" />}>
        <WorkspaceSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton minHeight="480px" />}>
        <LocationsSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton minHeight="240px" />}>
        <StatsSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton minHeight="320px" />}>
        <TestimonialSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton minHeight="400px" />}>
        <CtaBandSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton minHeight="320px" />}>
        <HomeFooter />
      </Suspense>
    </div>
  );
}
