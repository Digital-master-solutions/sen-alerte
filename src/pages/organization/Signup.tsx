import { useEffect } from "react";
import { OrganizationSignupStepper } from "@/components/organization/OrganizationSignupStepper";

export default function OrganizationSignup() {
  useEffect(() => {
    document.title = "Inscription Organisation | SenAlert";
  }, []);

  return <OrganizationSignupStepper />;
}