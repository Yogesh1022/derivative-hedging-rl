// ═══════════════════════════════════════════════════════════════
// NEW POSITION MODAL - Create new trading positions
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { C } from "../../constants/colors";

export const NewPositionModal = ({ onClose, onCreate, portfolios = [] }) => {
  const [portfolioId, setPortfolioId] = useState("");
  const [symbol, setSymbol] = useState("");
  const [assetType, setAssetType] = useState("STOCK");
  const [quantity, setQuantity] = useState("");
  const [avgPrice, setAvgPrice] = useState("");
  const [currentPrice, setCurrentPrice] = useState("");
  
  // Option-specific fields
  const [optionType, setOptionType] = useState("CALL");
  const [strikePrice, setStrikePrice] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Set first portfolio as default
  useEffect(() => {
    if (portfolios.length > 0 && !portfolioId) {
      setPortfolioId(portfolios[0].id);
    }
  }, [portfolios, portfolioId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!portfolioId || !symbol || !quantity || !avgPrice) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);

      const positionData = {
        portfolioId,
        symbol: symbol.toUpperCase(),
        assetType,
        quantity: parseFloat(quantity),
        avgPrice: parseFloat(avgPrice),
        currentPrice: currentPrice ? parseFloat(currentPrice) : parseFloat(avgPrice),
      };

      // Add option-specific fields
      if (assetType === "OPTION") {
        positionData.optionType = optionType;
        if (strikePrice) positionData.strikePrice = parseFloat(strikePrice);
        if (expiryDate) positionData.expiryDate = expiryDate;
      }

      await onCreate(positionData);
      onClose();
    } catch (err) {
      console.error("Failed to create position:", err);
      setError(err.response?.data?.message || err.message || "Failed to create position");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.white,
          borderRadius: 16,
          padding: 32,
          minWidth: 500,
          maxWidth: 600,
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: C.shadowMd,
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px", color: C.text }}>
          📊 New Position
        </h2>
        <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 24px" }}>
          Create a new trading position in your portfolio
        </p>

        {error && (
          <div
            style={{
              background: "#FFF0F0",
              border: `1px solid ${C.red}`,
              borderRadius: 8,
              padding: 12,
              marginBottom: 20,
              fontSize: 13,
              color: C.red,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Portfolio Selection */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: C.textSub,
                  marginBottom: 6,
                }}
              >
                Portfolio *
              </label>
              <select
                value={portfolioId}
                onChange={(e) => setPortfolioId(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  fontSize: 13,
                  fontFamily: "inherit",
                  background: C.white,
                }}
              >
                <option value="">Select Portfolio</option>
                {portfolios.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Asset Type */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: C.textSub,
                  marginBottom: 6,
                }}
              >
                Asset Type *
              </label>
              <select
                value={assetType}
                onChange={(e) => setAssetType(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  fontSize: 13,
                  fontFamily: "inherit",
                  background: C.white,
                }}
              >
                <option value="STOCK">Stock</option>
                <option value="OPTION">Option</option>
                <option value="FUTURE">Future</option>
                <option value="BOND">Bond</option>
              </select>
            </div>

            {/* Symbol */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: C.textSub,
                  marginBottom: 6,
                }}
              >
                Symbol *
              </label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="e.g., AAPL"
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  fontSize: 13,
                  fontFamily: "inherit",
                }}
              />
            </div>

            {/* Quantity and Prices */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 600,
                    color: C.textSub,
                    marginBottom: 6,
                  }}
                >
                  Quantity *
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="any"
                  required
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    fontSize: 13,
                    fontFamily: "inherit",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 600,
                    color: C.textSub,
                    marginBottom: 6,
                  }}
                >
                  Entry Price *
                </label>
                <input
                  type="number"
                  value={avgPrice}
                  onChange={(e) => setAvgPrice(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    fontSize: 13,
                    fontFamily: "inherit",
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: C.textSub,
                  marginBottom: 6,
                }}
              >
                Current Price (Optional)
              </label>
              <input
                type="number"
                value={currentPrice}
                onChange={(e) => setCurrentPrice(e.target.value)}
                placeholder="Leave empty to use entry price"
                min="0"
                step="0.01"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  fontSize: 13,
                  fontFamily: "inherit",
                }}
              />
            </div>

            {/* Option-specific fields */}
            {assetType === "OPTION" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12,
                        fontWeight: 600,
                        color: C.textSub,
                        marginBottom: 6,
                      }}
                    >
                      Option Type
                    </label>
                    <select
                      value={optionType}
                      onChange={(e) => setOptionType(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: 8,
                        border: `1px solid ${C.border}`,
                        fontSize: 13,
                        fontFamily: "inherit",
                        background: C.white,
                      }}
                    >
                      <option value="CALL">Call</option>
                      <option value="PUT">Put</option>
                    </select>
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12,
                        fontWeight: 600,
                        color: C.textSub,
                        marginBottom: 6,
                      }}
                    >
                      Strike Price
                    </label>
                    <input
                      type="number"
                      value={strikePrice}
                      onChange={(e) => setStrikePrice(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: 8,
                        border: `1px solid ${C.border}`,
                        fontSize: 13,
                        fontFamily: "inherit",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 600,
                      color: C.textSub,
                      marginBottom: 6,
                    }}
                  >
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 8,
                      border: `1px solid ${C.border}`,
                      fontSize: 13,
                      fontFamily: "inherit",
                    }}
                  />
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div
              style={{
                display: "flex",
                gap: 12,
                marginTop: 8,
                paddingTop: 20,
                borderTop: `1px solid ${C.border}`,
              }}
            >
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "12px 24px",
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  background: C.white,
                  color: C.textSub,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "12px 24px",
                  borderRadius: 8,
                  border: "none",
                  background: loading ? C.textMuted : C.red,
                  color: C.white,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                {loading ? "Creating..." : "Create Position"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
