import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import Chatbot from './components/chatbot.js';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Unique storage key to prevent conflicts
const STORAGE_KEY = 'productivityData_v3';

function App() {
  // ======================
  // STATE MANAGEMENT
  // ======================
  
  // Calculator States
  const [carriedOver, setCarriedOver] = useState('');
  const [delivered, setDelivered] = useState('');
  const [remaining, setRemaining] = useState('');
  const [processed, setProcessed] = useState('');
  const [error1, setError1] = useState('');

  const [extraInput, setExtraInput] = useState('');
  const [cphResult, setCphResult] = useState('');
  const [error2, setError2] = useState('');
  const [cartonsProcessed, setCartonsProcessed] = useState(0);

  const [zRacks, setZRacks] = useState('');
  const [hoursHanging, setHoursHanging] = useState('');
  const [zphResult, setZphResult] = useState('');
  const [error3, setError3] = useState('');

  // Submission & UI States
  const [selectedDate, setSelectedDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submissionHistory, setSubmissionHistory] = useState([]);

  // Graph Configuration
  const [xAxisMetric, setXAxisMetric] = useState('date');
  const [yAxisMetric, setYAxisMetric] = useState('cph');

  // Overwrite Protection
  const [duplicateEntry, setDuplicateEntry] = useState(null);
  const [showOverwriteModal, setShowOverwriteModal] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState(null);

  // ======================
  // DATA PERSISTENCE LAYER
  // ======================

  // Load data on component mount
  useEffect(() => {
    const loadData = () => {
      try {
        const rawData = localStorage.getItem(STORAGE_KEY);
        if (!rawData) return;
        
        const parsedData = JSON.parse(rawData);
        
        // Validate loaded data structure
        if (!Array.isArray(parsedData)) {
          throw new Error("Invalid data format in storage");
        }

        // Filter out any corrupt entries
        const validData = parsedData.filter(entry => (
          entry.id &&
          entry.date &&
          !isNaN(new Date(entry.date).getTime()) &&
          typeof entry.carriedOver === 'number' &&
          typeof entry.palletsDelivered === 'number'
        ));

        if (validData.length > 0) {
          setSubmissionHistory(validData);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (error) {
        console.error("Data load error:", error);
        localStorage.removeItem(STORAGE_KEY);
      }
    };

    loadData();
  }, []);

  // Save data when submissionHistory changes
  useEffect(() => {
    const saveData = () => {
      try {
        if (submissionHistory.length > 0) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(submissionHistory));
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (error) {
        console.error("Storage error:", error);
        if (error.name === 'QuotaExceededError') {
          // Keep only the 100 most recent entries if storage is full
          setSubmissionHistory(prev => prev.slice(-100));
        }
      }
    };

    saveData();
  }, [submissionHistory]);

  // ======================
  // BUSINESS LOGIC
  // ======================

  // Calculate cartons (pallets × 25)
  useEffect(() => {
    const pallets = parseFloat(processed) || 0;
    setCartonsProcessed((pallets * 25).toFixed(2));
  }, [processed]);

  // Reset all form fields
  const resetAllForms = () => {
    setCarriedOver('');
    setDelivered('');
    setRemaining('');
    setProcessed('');
    setError1('');
    setExtraInput('');
    setCphResult('');
    setError2('');
    setZRacks('');
    setHoursHanging('');
    setZphResult('');
    setError3('');
  };

  // Validate all required fields are filled
  const allFieldsValid = () => {
    return (
      selectedDate &&
      carriedOver !== '' &&
      delivered !== '' &&
      remaining !== '' &&
      processed !== '' &&
      extraInput !== '' &&
      cphResult !== '' &&
      zRacks !== '' &&
      hoursHanging !== '' &&
      zphResult !== '' &&
      !error1 &&
      !error2 &&
      !error3
    );
  };

  // ======================
  // EVENT HANDLERS
  // ======================

  // Pallets calculation
  const handleCalculateProcessed = (e) => {
    e.preventDefault();
    const c = Math.max(0, parseFloat(carriedOver) || 0);
    const d = Math.max(0, parseFloat(delivered) || 0);
    const r = Math.max(0, parseFloat(remaining) || 0);

    if (r > c + d) {
      setError1("Remaining cannot exceed total pallets!");
      return;
    }
    setError1('');
    setProcessed((c + d - r).toFixed(2));
  };

  // CPH calculation
  const handleCphCalculate = (e) => {
    e.preventDefault();
    const eInput = parseFloat(extraInput) || 0;

    if (eInput === 0) {
      setError2("Hours worked cannot be zero!");
      return;
    }
    setError2('');
    setCphResult((cartonsProcessed / eInput).toFixed(2));
  };

  // ZPH calculation
  const handleZphCalculate = (e) => {
    e.preventDefault();
    const z = parseFloat(zRacks) || 0;
    const h = parseFloat(hoursHanging) || 0;

    if (h === 0) {
      setError3("Hours hanging cannot be zero!");
      return;
    }
    setError3('');
    setZphResult((z / h).toFixed(2));
  };

  // Main submission handler
  const handleSubmitAll = (e) => {
    e.preventDefault();
    
    const newEntry = {
      id: Date.now(), // Unique identifier
      date: selectedDate,
      carriedOver: parseFloat(carriedOver) || 0,
      palletsDelivered: parseFloat(delivered) || 0,
      remainingPallets: parseFloat(remaining) || 0,
      palletsProcessed: parseFloat(processed) || 0,
      cartonsProcessed: parseFloat(cartonsProcessed) || 0,
      cph: parseFloat(cphResult) || 0,
      zph: parseFloat(zphResult) || 0,
      hoursWorked: parseFloat(extraInput) || 0,
      timestamp: new Date(selectedDate).getTime()
    };

    // Check for existing entry with same date
    const existingEntryIndex = submissionHistory.findIndex(
      entry => entry.date === selectedDate
    );

    if (existingEntryIndex !== -1) {
      setDuplicateEntry(submissionHistory[existingEntryIndex]);
      setPendingSubmission(newEntry);
      setShowOverwriteModal(true);
      return;
    }

    proceedWithSubmission(newEntry);
  };

  // Handle overwrite confirmation
  const handleConfirmOverwrite = () => {
    const updatedHistory = submissionHistory.filter(
      entry => entry.date !== pendingSubmission.date
    );
    
    setSubmissionHistory([...updatedHistory, pendingSubmission]);
    setShowOverwriteModal(false);
    setDuplicateEntry(null);
    setPendingSubmission(null);
    
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      resetAllForms();
      setTimeout(() => setSubmitSuccess(false), 3000);
    }, 1500);
  };

  // Process new submission
  const proceedWithSubmission = (newEntry) => {
    setSubmissionHistory(prev => {
      const updated = [...prev.filter(item => item.date !== newEntry.date), newEntry];
      return updated.sort((a, b) => a.timestamp - b.timestamp);
    });
    
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      resetAllForms();
      setTimeout(() => setSubmitSuccess(false), 3000);
    }, 1500);
  };

  // ======================
  // UI COMPONENTS & HELPERS
  // ======================

  // Metric options for graph configuration
  const getMetricOptions = () => [
    { value: 'date', label: 'Date' },
    { value: 'remainingPallets', label: 'Remaining Pallets' },
    { value: 'palletsDelivered', label: 'Pallets Delivered' },
    { value: 'cartonsProcessed', label: 'Cartons Processed' },
    { value: 'cph', label: 'CPH' },
    { value: 'zph', label: 'ZPH' },
    { value: 'hoursWorked', label: 'Hours Worked' }
  ];

  // Prepare graph data with proper sorting
  const getGraphData = () => {
    let graphData = [...submissionHistory];
    
    if (xAxisMetric === 'date') {
      graphData.sort((a, b) => a.timestamp - b.timestamp);
    } else {
      graphData.sort((a, b) => a[xAxisMetric] - b[xAxisMetric]);
    }

    return graphData.map(entry => ({
      ...entry,
      date: new Date(entry.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    }));
  };

  // Overwrite confirmation modal
  const OverwriteConfirmationModal = () => (
    <div className={`modal fade ${showOverwriteModal ? 'show d-block' : ''}`} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-warning">
            <h5 className="modal-title">⚠️ Duplicate Entry Detected</h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setShowOverwriteModal(false)}
            />
          </div>
          <div className="modal-body">
            <p className="mb-4">You already have data for <strong>{new Date(duplicateEntry?.date).toLocaleDateString()}</strong>. Would you like to overwrite it?</p>
            
            <div className="row">
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header bg-light">
                    <h6>Existing Entry</h6>
                  </div>
                  <div className="card-body">
                    <ul className="list-group list-group-flush">
                      <li className="list-group-item d-flex justify-content-between">
                        <span>Pallets Processed:</span>
                        <span>{duplicateEntry?.palletsProcessed}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between">
                        <span>Cartons:</span>
                        <span>{duplicateEntry?.cartonsProcessed}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between">
                        <span>CPH:</span>
                        <span>{duplicateEntry?.cph}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between">
                        <span>ZPH:</span>
                        <span>{duplicateEntry?.zph}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header bg-light">
                    <h6>New Entry</h6>
                  </div>
                  <div className="card-body">
                    <ul className="list-group list-group-flush">
                      <li className="list-group-item d-flex justify-content-between">
                        <span>Pallets Processed:</span>
                        <span>{pendingSubmission?.palletsProcessed}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between">
                        <span>Cartons:</span>
                        <span>{pendingSubmission?.cartonsProcessed}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between">
                        <span>CPH:</span>
                        <span>{pendingSubmission?.cph}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between">
                        <span>ZPH:</span>
                        <span>{pendingSubmission?.zph}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setShowOverwriteModal(false)}
            >
              Keep Existing Data
            </button>
            <button 
              type="button" 
              className="btn btn-warning" 
              onClick={handleConfirmOverwrite}
            >
              Overwrite with New Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ======================
  // MAIN RENDER
  // ======================

  return (
    <div className="container mt-4">
      <OverwriteConfirmationModal />
      
      <h2 className="text-center mb-4">📊 Productivity Dashboard</h2>
      
      <div className="row g-3">
        {/* Pallets Calculator */}
        <div className="col-md-4">
          <div className="p-3 border rounded h-100 bg-light">
            <h5 className="text-primary mb-3">🧮 Pallets Calculator</h5>
            <form onSubmit={handleCalculateProcessed}>
              <div className="row g-2">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Carried-Over</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-control"
                    value={carriedOver}
                    onChange={(e) => setCarriedOver(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Delivered</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-control"
                    value={delivered}
                    onChange={(e) => setDelivered(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Remaining Pallets</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-control"
                  value={remaining}
                  onChange={(e) => setRemaining(e.target.value)}
                  required
                />
              </div>
              {error1 && <div className="alert alert-danger">{error1}</div>}
              <button type="submit" className="btn custom-btn w-100 mb-3">
                Calculate Processed
              </button>
              <div className="mb-3">
                <label className="form-label">Pallets Processed</label>
                <input
                  type="number"
                  className="form-control"
                  value={processed}
                  readOnly
                />
              </div>
            </form>
          </div>
        </div>

        {/* CPH Calculator */}
        <div className="col-md-4">
          <div className="p-3 border rounded h-100 bg-light">
            <h5 className="text-success mb-3">📦 CPH Calculator</h5>
            <form onSubmit={handleCphCalculate}>
              <div className="mb-3">
                <label className="form-label">Cartons Processed (Pallets × 25)</label>
                <input
                  type="number"
                  className="form-control"
                  value={cartonsProcessed}
                  readOnly
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Hours Worked</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  className="form-control"
                  value={extraInput}
                  onChange={(e) => setExtraInput(e.target.value)}
                  required
                />
              </div>
              {error2 && <div className="alert alert-danger">{error2}</div>}
              <button type="submit" className="btn custom-btn w-100 mb-3">
                Calculate CPH
              </button>
              <div className="mb-3">
                <label className="form-label">Cartons Per Hour</label>
                <input
                  type="number"
                  className="form-control"
                  value={cphResult}
                  readOnly
                />
              </div>
            </form>
          </div>
        </div>

        {/* ZPH Calculator */}
        <div className="col-md-4">
          <div className="p-3 border rounded h-100 bg-light">
            <h5 className="text-info mb-3">🏷️ ZPH Calculator</h5>
            <form onSubmit={handleZphCalculate}>
              <div className="mb-3">
                <label className="form-label">Z-Racks Filled</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-control"
                  value={zRacks}
                  onChange={(e) => setZRacks(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Hours Hanging</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  className="form-control"
                  value={hoursHanging}
                  onChange={(e) => setHoursHanging(e.target.value)}
                  required
                />
              </div>
              {error3 && <div className="alert alert-danger">{error3}</div>}
              <button type="submit" className="btn custom-btn w-100 mb-3">
                Calculate ZPH
              </button>
              <div className="mb-3">
                <label className="form-label">Z-Racks Per Hour</label>
                <input
                  type="number"
                  className="form-control"
                  value={zphResult}
                  readOnly
                />
              </div>
            </form>
          </div>
        </div>

        {/* Data Submission */}
        <div className="col-md-12 mt-4">
          <div className="p-3 border rounded bg-light">
            <h5 className="text-secondary mb-3">💾 Data Submission</h5>
            <form onSubmit={handleSubmitAll}>
              <div className="row align-items-end">
                <div className="col-md-3 mb-3">
                  <label className="form-label">Select Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-3 mb-3">
                  <div className="position-relative">
                    <button 
                      type="submit" 
                      className="btn btn-dark w-100 py-2"
                      disabled={isSubmitting || !allFieldsValid()}
                      style={{ height: '38px' }}
                    >
                      {isSubmitting ? (
                        <span className="d-flex align-items-center justify-content-center">
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Saving...
                        </span>
                      ) : (
                        'Submit All Data'
                      )}
                    </button>
                    {!allFieldsValid() && !isSubmitting && (
                      <div 
                        className="position-absolute top-0 end-0 mt-1 me-1 text-danger"
                        data-bs-toggle="tooltip" 
                        title="Complete all calculators first"
                      >
                        <i className="fas fa-exclamation-circle"></i>
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  {submitSuccess && (
                    <div className="alert alert-success mb-0 d-flex align-items-center">
                      <i className="fas fa-check-circle me-2"></i>
                      <div>
                        <strong>Success!</strong> Data saved to browser storage.
                        <div className="text-muted small">Will persist after refresh.</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Submission History */}
        <div className="col-md-12 mt-4">
          <div className="p-3 border rounded bg-light">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="text-secondary mb-0">📜 Submission History</h5>
              <div className="d-flex align-items-center">
                <span className="badge bg-primary me-2">
                  {submissionHistory.length} records
                </span>
                <button 
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => {
                    if (window.confirm("⚠️ Delete ALL history? This cannot be undone!")) {
                      setSubmissionHistory([]);
                    }
                  }}
                >
                  <i className="fas fa-trash-alt me-1"></i> Clear All
                </button>
              </div>
            </div>
            
            {submissionHistory.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Date</th>
                      <th>Carried Over</th>
                      <th>Delivered</th>
                      <th>Remaining</th>
                      <th>Cartons</th>
                      <th>CPH</th>
                      <th>ZPH</th>
                      <th>Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissionHistory.map((entry) => (
                      <tr key={entry.id}>
                        <td>{new Date(entry.date).toLocaleDateString()}</td>
                        <td>{entry.carriedOver.toFixed(2)}</td>
                        <td>{entry.palletsDelivered.toFixed(2)}</td>
                        <td>{entry.remainingPallets.toFixed(2)}</td>
                        <td>{entry.cartonsProcessed.toFixed(2)}</td>
                        <td>{entry.cph.toFixed(2)}</td>
                        <td>{entry.zph.toFixed(2)}</td>
                        <td>{entry.hoursWorked.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="alert alert-info mb-0">
                <i className="fas fa-info-circle me-2"></i>
                No submissions yet. Data will persist after page reloads.
              </div>
            )}
          </div>
        </div>

        {/* Data Visualization */}
        <div className="col-md-12 mt-4">
          <div className="p-3 border rounded bg-light">
            <h5 className="text-secondary mb-3">📈 Data Visualization</h5>
            {submissionHistory.length > 1 ? (
              <>
                <div className="row mb-4">
                  <div className="col-md-5">
                    <label className="form-label">X-Axis Metric</label>
                    <select 
                      className="form-select"
                      value={xAxisMetric}
                      onChange={(e) => setXAxisMetric(e.target.value)}
                    >
                      {getMetricOptions().map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-5">
                    <label className="form-label">Y-Axis Metric</label>
                    <select 
                      className="form-select"
                      value={yAxisMetric}
                      onChange={(e) => setYAxisMetric(e.target.value)}
                    >
                      {getMetricOptions().map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ width: '100%', height: '400px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={getGraphData()}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis 
                        dataKey={xAxisMetric}
                        tick={{ fill: '#555' }}
                        tickMargin={10}
                      />
                      <YAxis 
                        tick={{ fill: '#555' }}
                        tickMargin={10}
                      />
                      <Tooltip 
                        contentStyle={{
                          background: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey={yAxisMetric}
                        stroke="#8884d8"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : submissionHistory.length === 1 ? (
              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                Submit at least 2 entries to generate a meaningful graph.
              </div>
            ) : (
              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                No data available for visualization.
              </div>
            )}
          </div>
        </div>
      </div>
      <Chatbot />
    </div>
  );
}

export default App;