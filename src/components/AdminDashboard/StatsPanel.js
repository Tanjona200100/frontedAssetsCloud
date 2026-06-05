// components/AdminDashboard/StatsPanel.jsx
const StatsPanel = () => {
  const hours = ["0h", "2h", "4h", "6h", "8h", "10h", "12h", "14h", "16h", "18h", "20h", "22h"];
  const heights = [20, 12, 8, 15, 42, 78, 95, 88, 72, 55, 35, 22];
  const colors = heights.map((h, i) => h >= 40 ? "green-bar" : "blue-bar");

  return (
    <>
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
              </svg>
            </div>
            <span className="stat-delta up">+18%</span>
          </div>
          <div className="stat-val">9 240</div>
          <div className="stat-label">Sessions ce mois</div>
        </div>
        <div className="stat-card green">
          <div className="stat-top">
            <div className="stat-icon green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17,8 12,3 7,8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <span className="stat-delta up">+34%</span>
          </div>
          <div className="stat-val">24 810</div>
          <div className="stat-label">Uploads ce mois</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-top">
            <div className="stat-icon amber">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3,6 5,6 21,6" />
                <path d="M19 6l-1 14H6L5 6" />
              </svg>
            </div>
            <span className="stat-delta dn">-2%</span>
          </div>
          <div className="stat-val">187</div>
          <div className="stat-label">Suppressions ce mois</div>
        </div>
      </div>
      <div className="chart-card">
        <div className="card-header">
          <span className="card-title">Activité par heure (aujourd'hui)</span>
        </div>
        <div className="chart-area">
          <div className="bar-chart">
            {hours.map((hour, i) => (
              <div key={hour} className="bar-wrap">
                <div className={`bar ${colors[i]}`} style={{ height: `${heights[i]}%` }}></div>
                <span className="bar-label">{hour}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default StatsPanel;