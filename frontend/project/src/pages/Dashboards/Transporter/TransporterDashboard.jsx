import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  runTransaction,
  doc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { db } from "../../../js/firebase";
import { useAuth } from "../../../state/authStore";
import "../../../styles/transporter-dashboard.css";

export default function TransporterDashboard() {
  const { user } = useAuth();

  const [openJobs, setOpenJobs] = useState([]);
  const [activeJob, setActiveJob] = useState(null);
  const [completedJobs, setCompletedJobs] = useState([]);
  const [showContact, setShowContact] = useState(false);

  /* ================= ACTIVE JOB ================= */
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "transport_requests"),
      where("transporterId", "==", user.uid),
      where("status", "in", ["accepted", "paused"])
    );

    return onSnapshot(q, (snap) => {
      setActiveJob(
        snap.docs[0]
          ? { id: snap.docs[0].id, ...snap.docs[0].data() }
          : null
      );
    });
  }, [user]);

  /* ================= OPEN JOBS ================= */
  useEffect(() => {
    if (!user || activeJob) {
      setOpenJobs([]);
      return;
    }

    const q = query(
      collection(db, "transport_requests"),
      where("status", "==", "open")
    );

    return onSnapshot(q, (snap) => {
      setOpenJobs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [user, activeJob]);

  /* ================= COMPLETED JOBS ================= */
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "transport_requests"),
      where("transporterId", "==", user.uid),
      where("status", "==", "completed")
    );

    return onSnapshot(q, (snap) => {
      setCompletedJobs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [user]);

  /* ================= ACTIONS ================= */

  const updateStatus = async (status) => {
    if (!activeJob) return;

    await runTransaction(db, async (tx) => {
      tx.update(doc(db, "transport_requests", activeJob.id), {
        status,
        updatedAt: serverTimestamp(),
      });
    });
  };

  const acceptJob = async (jobId) => {
    const activeSnap = await getDocs(
      query(
        collection(db, "transport_requests"),
        where("transporterId", "==", user.uid),
        where("status", "in", ["accepted", "paused"])
      )
    );

    if (!activeSnap.empty) {
      alert("You already have an active delivery.");
      return;
    }

    await runTransaction(db, async (tx) => {
      const jobRef = doc(db, "transport_requests", jobId);
      const job = (await tx.get(jobRef)).data();

      const stockRef = doc(db, "stocks", job.stockId);
      const stock = (await tx.get(stockRef)).data();

      if (stock.transportStatus !== "available") {
        throw new Error("Stock already in delivery.");
      }

      tx.update(jobRef, {
        status: "accepted",
        transporterId: user.uid,
        updatedAt: serverTimestamp(),
      });

      tx.update(stockRef, { transportStatus: "in_delivery" });
    });
  };

  const completeJob = async () => {
    await runTransaction(db, async (tx) => {
      tx.update(doc(db, "transport_requests", activeJob.id), {
        status: "completed",
        updatedAt: serverTimestamp(),
      });

      tx.update(doc(db, "stocks", activeJob.stockId), {
        transportStatus: "delivered",
      });
    });
  };

  const cancelJob = async () => {
    await runTransaction(db, async (tx) => {
      tx.update(doc(db, "transport_requests", activeJob.id), {
        status: "open",
        transporterId: null,
        updatedAt: serverTimestamp(),
      });

      tx.update(doc(db, "stocks", activeJob.stockId), {
        transportStatus: "available",
      });
    });
  };

  const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    activeJob?.pickupLocation || "Sri Lanka"
  )}&z=10&output=embed`;

  return (
    <div className="dashboard-container transporter-dashboard">
      {/* ================= HEADER ================= */}
      <header className="transporter-header">
        <div>
          <h1 className="dashboard-title">Transporter Dashboard</h1>
          <p className="dashboard-subtitle">One delivery at a time</p>
        </div>

        <button
          className="btn ghost"
          onClick={() => (window.location.href = "/")}
        >
          ← Home
        </button>
      </header>

      <div className="transporter-layout">
        {/* LEFT */}
        <div className="transporter-left">
          {activeJob && (
            <section className="transporter-main liquid-glass">
              <h2>Current Delivery</h2>

              {/* UBER STYLE PROGRESS */}
              <div className="uber-progress">
                <div className="progress-label start">
                  📍 {activeJob.pickupLocation}
                </div>

                <div className="track" />
                <div className="fill" />
                <div className="vehicle">🚚</div>

                <div className="progress-label end">
                  🏁 {activeJob.market}
                </div>
              </div>

              <p>
                <strong>Vegetable:</strong> {activeJob.vegetable}
              </p>
              <p>
                <strong>Pickup:</strong> {activeJob.pickupLocation}
              </p>
              <p>
                <strong>Market:</strong> {activeJob.market}
              </p>

              <div className="action-row">
                {activeJob.status === "accepted" && (
                  <button
                    className="btn blue"
                    onClick={() => updateStatus("paused")}
                  >
                    Pause
                  </button>
                )}

                {activeJob.status === "paused" && (
                  <button
                    className="btn blue"
                    onClick={() => updateStatus("accepted")}
                  >
                    Resume
                  </button>
                )}

                <button className="btn green" onClick={completeJob}>
                  Finish Delivery
                </button>

                <button className="btn red" onClick={cancelJob}>
                  Cancel
                </button>

                <button
                  className="btn white"
                  onClick={() => setShowContact(true)}
                >
                  Contact Farmer
                </button>
              </div>
            </section>
          )}

          {!activeJob && (
            <section className="transporter-main liquid-glass">
              <h2>Available Transport Jobs</h2>

              {openJobs.length === 0 && (
                <p className="empty-hint">🚚 No jobs available right now</p>
              )}

              <div className="transporter-jobs">
                {openJobs.map((job) => (
                  <div key={job.id} className="transporter-job-card">
                    <p>
                      <strong>Vegetable:</strong> {job.vegetable}
                    </p>
                    <p>
                      <strong>Pickup:</strong> {job.pickupLocation}
                    </p>
                    <p>
                      <strong>Market:</strong> {job.market}
                    </p>

                    <button
                      className="btn"
                      onClick={() => acceptJob(job.id)}
                    >
                      Accept Transport
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* COMPLETED */}
          <section className="transporter-main liquid-glass">
            <h2>Previous Deliveries</h2>

            {completedJobs.length === 0 && (
              <p className="empty-hint">No completed deliveries yet.</p>
            )}

            {completedJobs.map((job) => (
              <div key={job.id} className="completed-card">
                <p>
                  <strong>{job.vegetable}</strong> → {job.market}
                </p>
              </div>
            ))}
          </section>
        </div>

        {/* MAP */}
        <div className="transporter-map liquid-glass">
          <h3>Route Preview</h3>
          <div className="map-frame">
            <iframe title="map" src={mapUrl} />
          </div>
        </div>
      </div>

      {/* CONTACT MODAL */}
      {showContact && (
        <div
          className="modal-overlay"
          onClick={() => setShowContact(false)}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Farmer Contact</h3>
            <p>
              <strong>Phone:</strong>{" "}
              {activeJob.phone || "Not available"}
            </p>
            <button className="btn" onClick={() => setShowContact(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
