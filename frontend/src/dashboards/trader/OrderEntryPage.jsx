import { useState, useEffect } from "react";
import { C } from "../../constants/colors";
import { Card, Button, Select } from "../common";
import { portfolioService } from "../../services/portfolioService";
import { tradeService } from "../../services/tradeService";
import { positionService } from "../../services/positionService";

export const OrderEntryPage = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState("");
  const [orderType, setOrderType] = useState("BUY");
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [assetType, setAssetType] = useState("STOCK");
  const [optionType, setOptionType] = useState("CALL");
  const [strikePrice, setStrikePrice] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPortfolios = async () => {
      try {
        const data = await portfolioService.getAllPortfolios();
        setPortfolios(data || []);
        if (data && data.length > 0) {
          setSelectedPortfolio(data[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch portfolios:", err);
      }
    };
    fetchPortfolios();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedPortfolio || !symbol || !quantity || !price) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);

      const tradeData = {
        portfolioId: selectedPortfolio,
        symbol: symbol.toUpperCase(),
        side: orderType,
        quantity: parseFloat(quantity),
        price: parseFloat(price),
        commission: 0.99,
      };

      // Create trade
      const trade = await tradeService.createTrade(tradeData);

      // If it's a buy order, create a position
      if (orderType === "BUY") {
        const positionData = {
          portfolioId: selectedPortfolio,
          symbol: symbol.toUpperCase(),
          assetType: assetType,
          quantity: parseFloat(quantity),
          avgPrice: parseFloat(price),
          currentPrice: parseFloat(price),
        };

        // Add option-specific fields
        if (assetType === "OPTION") {
          positionData.optionType = optionType;
          if (strikePrice) positionData.strikePrice = parseFloat(strikePrice);
          if (expiryDate) positionData.expiryDate = expiryDate;
        }

        await positionService.createPosition(positionData);
      }

      setSuccess(`${orderType} order for ${quantity} ${symbol} executed successfully!`);
      
      // Reset form
      setSymbol("");
      setQuantity("");
      setPrice("");
      setStrikePrice("");
      setExpiryDate("");

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      console.error("Order execution failed:", err);
      setError(err.response?.data?.message || "Failed to execute order");
    } finally {
      setLoading(false);
    }
  };

  const estimatedTotal = quantity && price 
    ? (parseFloat(quantity) * parseFloat(price) + 0.99).toFixed(2)
    : "0.00";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: C.text }}>
          📝 Order Entry
        </h2>
      </div>

      {success && (
        <div
          style={{
            background: C.successLight,
            border: `1px solid ${C.success}`,
            borderRadius: 8,
            padding: 14,
            color: C.success,
            fontWeight: 600,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span>✅</span> {success}
        </div>
      )}

      {error && (
        <div
          style={{
            background: C.redLight,
            border: `1px solid ${C.red}`,
            borderRadius: 8,
            padding: 14,
            color: C.red,
            fontWeight: 600,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span>❌</span> {error}
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit}>
          {/* Order Type Toggle */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.textMuted, marginBottom: 8 }}>
              ORDER TYPE
            </label>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                type="button"
                onClick={() => setOrderType("BUY")}
                style={{
                  flex: 1,
                  padding: "12px 20px",
                  border: orderType === "BUY" ? `2px solid ${C.success}` : `1px solid ${C.border}`,
                  borderRadius: 8,
                  background: orderType === "BUY" ? C.successLight : C.white,
                  color: orderType === "BUY" ? C.success : C.text,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                🟢 BUY
              </button>
              <button
                type="button"
                onClick={() => setOrderType("SELL")}
                style={{
                  flex: 1,
                  padding: "12px 20px",
                  border: orderType === "SELL" ? `2px solid ${C.red}` : `1px solid ${C.border}`,
                  borderRadius: 8,
                  background: orderType === "SELL" ? C.redLight : C.white,
                  color: orderType === "SELL" ? C.red : C.text,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                🔴 SELL
              </button>
            </div>
          </div>

          {/* Portfolio Selection */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.textMuted, marginBottom: 6 }}>
              PORTFOLIO *
            </label>
            <select
              value={selectedPortfolio}
              onChange={(e) => setSelectedPortfolio(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: C.white,
                color: C.text,
                fontSize: 13,
                fontFamily: "inherit",
              }}
            >
              <option value="">Select Portfolio</option>
              {portfolios.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (${p.totalValue?.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          {/* Asset Type */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.textMuted, marginBottom: 6 }}>
              ASSET TYPE
            </label>
            <select
              value={assetType}
              onChange={(e) => setAssetType(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: C.white,
                color: C.text,
                fontSize: 13,
                fontFamily: "inherit",
              }}
            >
              <option value="STOCK">Stock</option>
              <option value="OPTION">Option</option>
              <option value="FUTURE">Future</option>
              <option value="FOREX">Forex</option>
              <option value="CRYPTO">Crypto</option>
            </select>
          </div>

          {/* Symbol */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.textMuted, marginBottom: 6 }}>
              SYMBOL *
            </label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="e.g., AAPL, TSLA"
              required
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: C.white,
                color: C.text,
                fontSize: 13,
                fontFamily: "inherit",
                textTransform: "uppercase",
              }}
            />
          </div>

          {/* Option-specific fields */}
          {assetType === "OPTION" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.textMuted, marginBottom: 6 }}>
                    OPTION TYPE
                  </label>
                  <select
                    value={optionType}
                    onChange={(e) => setOptionType(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 8,
                      border: `1px solid ${C.border}`,
                      background: C.white,
                      color: C.text,
                      fontSize: 13,
                      fontFamily: "inherit",
                    }}
                  >
                    <option value="CALL">Call</option>
                    <option value="PUT">Put</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.textMuted, marginBottom: 6 }}>
                    STRIKE PRICE
                  </label>
                  <input
                    type="number"
                    value={strikePrice}
                    onChange={(e) => setStrikePrice(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 8,
                      border: `1px solid ${C.border}`,
                      background: C.white,
                      color: C.text,
                      fontSize: 13,
                      fontFamily: "inherit",
                    }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.textMuted, marginBottom: 6 }}>
                  EXPIRY DATE
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
                    background: C.white,
                    color: C.text,
                    fontSize: 13,
                    fontFamily: "inherit",
                  }}
                />
              </div>
            </>
          )}

          {/* Quantity and Price */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.textMuted, marginBottom: 6 }}>
                QUANTITY *
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                min="0"
                step="1"
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  background: C.white,
                  color: C.text,
                  fontSize: 13,
                  fontFamily: "inherit",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.textMuted, marginBottom: 6 }}>
                PRICE * ($)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  background: C.white,
                  color: C.text,
                  fontSize: 13,
                  fontFamily: "inherit",
                }}
              />
            </div>
          </div>

          {/* Order Summary */}
          <div
            style={{
              background: C.bgLight,
              borderRadius: 8,
              padding: 16,
              marginBottom: 24,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, marginBottom: 12 }}>
              ORDER SUMMARY
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: C.textSub }}>Subtotal</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                ${quantity && price ? (parseFloat(quantity) * parseFloat(price)).toFixed(2) : "0.00"}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: C.textSub }}>Commission</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>$0.99</span>
            </div>
            <div
              style={{
                borderTop: `1px solid ${C.border}`,
                paddingTop: 8,
                marginTop: 8,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 700 }}>Total</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: orderType === "BUY" ? C.success : C.red }}>
                {orderType === "BUY" ? "-" : "+"}${estimatedTotal}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px 20px",
              border: "none",
              borderRadius: 8,
              background: loading ? C.textMuted : orderType === "BUY" ? C.success : C.red,
              color: C.white,
              fontSize: 14,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Processing..." : `${orderType} ${symbol || "Asset"}`}
          </button>
        </form>
      </Card>

      {/* Quick Info */}
      <Card>
        <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: C.text }}>
          💡 Trading Tips
        </h3>
        <ul style={{ margin: 0, paddingLeft: 20, color: C.textSub, fontSize: 12, lineHeight: 1.8 }}>
          <li>All orders are executed instantly at the specified price</li>
          <li>Commission is $0.99 per trade</li>
          <li>BUY orders automatically create new positions</li>
          <li>SELL orders reduce existing positions</li>
          <li>Options include strike price and expiry date</li>
        </ul>
      </Card>
    </div>
  );
};
