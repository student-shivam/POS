import React, { useEffect, useRef, useState } from "react";
import DefaultLayout from "../components/DefaultLayout";
import API from "../api";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  DeleteOutlined,
  PlusOutlined,
  MinusOutlined,
  CreditCardOutlined,
  DollarOutlined,
  UserOutlined,
  PhoneOutlined,
  ShoppingCartOutlined,
  PrinterOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import {
  Row,
  Col,
  Card,
  Button,
  Divider,
  Form,
  Input,
  Select,
  Typography,
  Space,
  message,
  Modal,
} from "antd";
import ReactToPrint from "react-to-print";

const { Title, Text } = Typography;

const CartPage = () => {
  const [subTotal, setSubTotal] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [billPopup, setBillPopup] = useState(false);
  const [invoicePayload, setInvoicePayload] = useState(null);
  const [customerData, setCustomerData] = useState({});
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { cartItems } = useSelector((state) => state.rootReducer);
  const printRef = useRef();
  const [form] = Form.useForm();

  useEffect(() => {
    document.title = "Ravindra Restaurant POS Invoice";
  }, []);

  useEffect(() => {
    let temp = 0;
    cartItems.forEach((item) => {
      temp += item.price * item.quantity;
    });
    const tax = Number(((temp / 100) * 12).toFixed(2));
    setSubTotal(temp);
    setTaxAmount(tax);
    setTotalAmount(Number((temp + tax).toFixed(2)));
  }, [cartItems]);

  const handleIncrement = (record) => {
    dispatch({
      type: "UPDATE_CART",
      payload: { ...record, quantity: record.quantity + 1 },
    });
  };

  const handleDecrement = (record) => {
    if (record.quantity === 1) return;
    dispatch({
      type: "UPDATE_CART",
      payload: { ...record, quantity: record.quantity - 1 },
    });
  };

  const handleRemove = (record) => {
    dispatch({ type: "DELETE_FROM_CART", payload: record });
    message.success(`${record.name} removed from cart`);
  };

  const handleSubmit = async (values) => {
    if (!cartItems.length) {
      return message.warning("Add items before generating the bill.");
    }

    const payload = {
      ...values,
      cartItems,
      subTotal,
      tax: taxAmount,
      totalAmount,
      userId: JSON.parse(localStorage.getItem("auth"))?._id,
      invoiceId: `INV-${Date.now().toString().slice(-8)}`,
      createdAt: new Date().toISOString(),
    };

    try {
      await API.post("/api/bills/add-bills", payload);
      dispatch({ type: "CLEAR_CART" });
      setCustomerData(values);
      setInvoicePayload(payload);
      setBillPopup(false);
      message.success("Bill generated successfully. Use the PDF button below.");
    } catch (error) {
      message.error("Could not generate the bill. Try again.");
      console.error(error);
    }
  };

  return (
    <DefaultLayout>
      <div className="page-header cart-page-header">
        <div>
          <Title level={2}>Cart & Checkout</Title>
          <Text type="secondary">
            Review your selected items, update quantities, and generate a clean bill in one place.
          </Text>
        </div>
      </div>

      <div className="cart-stats-row">
        <div className="stat-card">
          <Text type="secondary">Items in cart</Text>
          <Title level={3}>{cartItems.length}</Title>
        </div>
        <div className="stat-card">
          <Text type="secondary">Subtotal</Text>
          <Title level={3}>₹{subTotal.toFixed(2)}</Title>
        </div>
        <div className="stat-card highlight-card">
          <Text type="secondary">Total payable</Text>
          <Title level={3}>₹{totalAmount.toFixed(2)}</Title>
        </div>
      </div>

      <div className="cart-layout cart-redesign-layout">
        <div className="cart-main">
          {cartItems.length === 0 ? (
            <Empty description="Your cart is empty" />
          ) : (
            cartItems.map((item) => (
              <Card className="cart-item-card glass-morph" key={item._id} bodyStyle={{ padding: 20 }}>
                <Row align="middle" gutter={[16, 16]}>
                  <Col xs={24} sm={6}>
                    <div className="cart-item-image">
                      <img src={item.image} alt={item.name} />
                    </div>
                  </Col>

                  <Col xs={24} sm={10}>
                    <Title level={4} className="cart-item-title">
                      {item.name}
                    </Title>
                    <Text type="secondary">{item.category?.toUpperCase() || "GENERAL"}</Text>
                    <div className="cart-item-price">
                      <Text strong>₹{item.price.toFixed(2)}</Text>
                      <Text type="secondary"> each</Text>
                    </div>
                  </Col>

                  <Col xs={24} sm={8} className="cart-item-actions">
                    <div className="quantity-controls">
                      <Button shape="circle" icon={<MinusOutlined />} onClick={() => handleDecrement(item)} />
                      <Text className="quantity-value">{item.quantity}</Text>
                      <Button shape="circle" icon={<PlusOutlined />} onClick={() => handleIncrement(item)} />
                    </div>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemove(item)}
                    >
                      Remove
                    </Button>
                  </Col>

                  <Col xs={24} sm={24}>
                    <Divider style={{ margin: "12px 0" }} />
                    <Space size="large" className="cart-item-summary">
                      <div>
                        <Text type="secondary">Item Total</Text>
                        <div className="summary-value">₹{(item.price * item.quantity).toFixed(2)}</div>
                      </div>
                      <div>
                        <Text type="secondary">GST 12%</Text>
                        <div className="summary-value">₹{((item.price * item.quantity * 0.12).toFixed(2))}</div>
                      </div>
                    </Space>
                  </Col>
                </Row>
              </Card>
            ))
          )}
        </div>

        <aside className="billing-panel glass-morph billing-redesign-panel">
          <Title level={4}>Invoice Summary</Title>
          <div className="billing-stat-row">
            <span>Total Items</span>
            <span>{cartItems.length}</span>
          </div>
          <div className="billing-stat-row">
            <span>Subtotal</span>
            <span>₹{subTotal.toFixed(2)}</span>
          </div>
          <div className="billing-stat-row">
            <span>GST (12%)</span>
            <span>₹{taxAmount.toFixed(2)}</span>
          </div>
          <Divider />
          <div className="billing-stat-row billing-total-row">
            <Title level={4}>Grand Total</Title>
            <Title level={4}>₹{totalAmount.toFixed(2)}</Title>
          </div>

          <Button
            type="primary"
            size="large"
            block
            disabled={cartItems.length === 0}
            onClick={() => setBillPopup(true)}
            icon={<PrinterOutlined />}
          >
            Generate Bill
          </Button>

          {invoicePayload && (
            <div className="invoice-print-actions">
              <ReactToPrint
                trigger={() => (
                  <Button type="default" icon={<FilePdfOutlined />} block style={{ marginTop: 16, borderRadius: 12 }}>
                    Download Invoice PDF
                  </Button>
                )}
                content={() => printRef.current}
                pageStyle="@page { size: A4 portrait; margin: 12mm; } @media print { body { font-family: 'Inter', sans-serif; color: #1f2937; width: 100%; } .invoice-card { padding: 16px !important; } .invoice-items-header, .invoice-items-row { padding: 0.75rem 0.9rem !important; } .invoice-summary-block { max-width: 100% !important; margin-left: 0 !important; } }"
              />
            </div>
          )}
        </aside>
      </div>

      <div className="invoice-print-layout" ref={printRef}>
            <div className="invoice-print-wrapper">
              <Card className="invoice-card" bodyStyle={{ padding: 22 }}>
                <div className="invoice-top-section">
                  <div>
                    <Title level={3} style={{ marginBottom: 4 }}>Ravindra Restaurant</Title>
                    <Text type="secondary">Invoice</Text>
                  </div>
                  <div className="invoice-meta-block">
                    <div>
                      <Text type="secondary">Invoice #</Text>
                      <div className="invoice-meta-value">{invoicePayload?.invoiceId || "INV-000000"}</div>
                    </div>
                    <div>
                      <Text type="secondary">Date</Text>
                      <div className="invoice-meta-value">{invoicePayload ? new Date(invoicePayload.createdAt).toLocaleString() : new Date().toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                <div className="invoice-details-section">
                  <div>
                    <Text strong>Customer</Text>
                    <div>{customerData.customerName || invoicePayload?.customerName || "Walk-in Customer"}</div>
                    <div>{customerData.customerNumber || invoicePayload?.customerNumber || "No contact provided"}</div>
                  </div>
                  <div>
                    <Text strong>Payment</Text>
                    <div>{invoicePayload?.paymentMode?.toUpperCase() || "CASH"}</div>
                  </div>
                </div>

                <div className="invoice-items-table">
                  <div className="invoice-items-header">
                    <Text strong>Description</Text>
                    <Text strong>Qty</Text>
                    <Text strong>Rate</Text>
                    <Text strong>Total</Text>
                  </div>
                  {(invoicePayload?.cartItems || []).map((item) => (
                    <div className="invoice-items-row" key={item._id}>
                      <div className="invoice-item-name-col">
                        <Text>{item.name}</Text>
                        <Text type="secondary">{item.category || "General"}</Text>
                      </div>
                      <Text>{item.quantity}</Text>
                      <Text>₹{item.price.toFixed(2)}</Text>
                      <Text>₹{(item.price * item.quantity).toFixed(2)}</Text>
                    </div>
                  ))}
                </div>

                <div className="invoice-summary-block">
                  <div className="invoice-summary-row">
                    <Text type="secondary">Subtotal</Text>
                    <Text>₹{invoicePayload?.subTotal.toFixed(2) || "0.00"}</Text>
                  </div>
                  <div className="invoice-summary-row">
                    <Text type="secondary">GST (12%)</Text>
                    <Text>₹{invoicePayload?.tax.toFixed(2) || "0.00"}</Text>
                  </div>
                  <Divider />
                  <div className="invoice-summary-total">
                    <Title level={4}>Total</Title>
                    <Title level={4}>₹{invoicePayload?.totalAmount.toFixed(2) || "0.00"}</Title>
                  </div>
                </div>

                <div className="invoice-footer-note">
                  <Text type="secondary">Thank you for your order. Visit again!</Text>
                </div>
              </Card>
            </div>
          </div>
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CreditCardOutlined style={{ color: "var(--primary)" }} />
            <span>Customer Details</span>
          </div>
        }
        visible={billPopup}
        onCancel={() => setBillPopup(false)}
        footer={null}
        width={480}
      >
        <Form layout="vertical" form={form} onFinish={handleSubmit} style={{ marginTop: 16 }}>
          <Form.Item
            name="customerName"
            label="Customer Name"
            rules={[{ required: true, message: "Enter customer name" }]}
          >
            <Input prefix={<UserOutlined />} placeholder="John Doe" size="large" />
          </Form.Item>
          <Form.Item
            name="customerNumber"
            label="Contact Number"
            rules={[{ required: true, message: "Enter contact number" }]}
          >
            <Input prefix={<PhoneOutlined />} placeholder="9876543210" size="large" />
          </Form.Item>
          <Form.Item
            name="paymentMode"
            label="Payment Method"
            rules={[{ required: true, message: "Select payment method" }]}
          >
            <Select size="large">
              <Select.Option value="cash">Cash</Select.Option>
              <Select.Option value="card">Card / UPI</Select.Option>
            </Select>
          </Form.Item>
          <div className="bill-summary-mini" style={{ padding: 18, borderRadius: 14, border: "1px solid var(--border-color)", background: "var(--bg-secondary)" }}>
            <div className="d-flex justify-content-between">
              <Text type="secondary">Invoice Total</Text>
              <Text strong>₹{totalAmount.toFixed(2)}</Text>
            </div>
          </div>
          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button onClick={() => setBillPopup(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              Generate Bill
            </Button>
          </Space>
        </Form>
      </Modal>
    </DefaultLayout>
  );
};

const Empty = ({ description }) => (
  <div className="empty-state">
    <ShoppingCartOutlined style={{ fontSize: 48, color: "var(--border-color)" }} />
    <p>{description}</p>
  </div>
);

export default CartPage;
