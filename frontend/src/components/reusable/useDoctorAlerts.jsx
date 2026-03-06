import { useEffect, useState } from "react";
import API_URL from "../../services/api";
import AlertModal from "./AlertModal";

const useDoctorAlerts = () => {
  const [alertData, setAlertData] = useState(null);

  useEffect(() => {

    const eventSource = new EventSource(
      `${API_URL}/api/stream-alerts`
    );

    eventSource.onopen = () => {
    };

    eventSource.onmessage = (event) => {

      const data = JSON.parse(event.data);

      setAlertData(data);
    };

    eventSource.onerror = (error) => {
    };

    return () => {
      eventSource.close();
    };
  }, []);


  return alertData ? (
    <AlertModal
      alertData={alertData}
      onClose={() => setAlertData(null)}
    />
  ) : null;
};

export default useDoctorAlerts;