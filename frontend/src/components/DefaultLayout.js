import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Layout, Menu, Button, Badge, Avatar, Space, notification } from "antd";
import io from "socket.io-client";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  MenuOutlined,
  CloseOutlined,
  UserOutlined,
  LogoutOutlined,
  HomeOutlined,
  UnorderedListOutlined,
  ShoppingCartOutlined,
  DashboardOutlined,
  ShopOutlined,
  TeamOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import "../styles/DefaultLayout.css";
import Spinner from "./Spinner";

const { Header, Sider, Content } = Layout;

const SOCKET_URL =
  process.env.REACT_APP_SOCKET_URL ||
  process.env.REACT_APP_API_URL ||
  "http://localhost:8080";

// Global socket instance
const socket = io(SOCKET_URL);

const DefaultLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, loading } = useSelector((state) => state.rootReducer);
  const [collapsed, setCollapsed] = useState(window.innerWidth < 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const user = JSON.parse(localStorage.getItem("auth"));

  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  // Sync cart items to local storage
  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    if (user?._id) {
      socket.emit("join", user._id);
      
      socket.on("order-status-update", (data) => {
        const { status, orderId } = data;
        notification.info({
          message: `Order Status: ${status}`,
          description: `Your order #${orderId.slice(-6).toUpperCase()} is now ${status}.`,

          placement: "topRight",
        });
        if (status === "Completed") {
          notification.success({
            message: "Order Completed! 🎉",
            description: "Your order has been successfully completed.",
          });
        }
      });
    }
    return () => {
      socket.off("order-status-update");
    };
  }, [user?._id]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const handleResize = () => {
      const mobileSize = window.innerWidth <= 768;
      setIsMobile(mobileSize);
      if (window.innerWidth < 1024) {
        setCollapsed(true);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };


  return (
    <Layout className="main-layout">
      {loading && <Spinner />}
      <div
        className={`sidebar-overlay ${!collapsed && isMobile ? "show" : ""}`}
        onClick={() => setCollapsed(true)}
      />
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        collapsedWidth={0}
        className={`sidebar-glass ${!collapsed ? "open" : ""}`}
        width={250}
      >
        <div className="logo-container">
          <div className="logo-icon">
            <ShopOutlined style={{ fontSize: 20 }} />
          </div>
          {!collapsed && <span className="logo-text">RAVINDRA FOOD</span>}
          {!collapsed && isMobile && (
            <Button
              type="text"
              className="sidebar-close-btn"
              icon={<CloseOutlined />}
              onClick={() => setCollapsed(true)}
              aria-label="Close sidebar"
            />
          )}
        </div>
        <Menu
          theme={theme}
          mode="inline"
          selectedKeys={[location.pathname]}
          className="side-menu"
          items={[
            ...(user?.role === "admin" ? [
              {
                key: "/dashboard",
                icon: <DashboardOutlined />,
                label: <Link to="/dashboard">Dashboard</Link>,
              },
            ] : []),
            {
              key: "/",
              icon: <HomeOutlined />,
              label: <Link to="/">POS</Link>,
            },
            ...(user?.role === "admin" ? [
              {
                key: "/order-management",
                icon: <ShoppingCartOutlined />,
                label: <Link to="/order-management">Order Details</Link>,
              },
            ] : []),
            {
              key: "/orders",
              icon: <UnorderedListOutlined />,
              label: <Link to="/orders">Order History</Link>,
            },
            ...(user?.role === "admin" ? [
              {
                key: "/items",
                icon: <UnorderedListOutlined />,
                label: <Link to="/items">Products / Inventory</Link>,
              },
              {
                key: "/customers",
                icon: <TeamOutlined />,
                label: <Link to="/customers">Customers</Link>,
              },
              {
                key: "/settings",
                icon: <SettingOutlined />,
                label: <Link to="/settings">Settings</Link>,
              },
            ] : []),
            {
              key: "divider",
              type: "divider",
              style: { margin: "8px 0", background: "var(--border-color)", opacity: 0.65 },
            },
            {
              key: "/logout",
              icon: <LogoutOutlined />,
              label: "Logout",
              className: "logout-item",
              onClick: () => {
                localStorage.removeItem("auth");
                localStorage.removeItem("token");
                navigate("/login");
              },
            },
          ]}
        />
      </Sider>
      <Layout className="site-layout">
        <Header className="header-glass">
          <div className="header-left">
            <Button
              type="text"
              className="trigger-btn"
              icon={
                React.createElement(
                  isMobile ? (collapsed ? MenuOutlined : CloseOutlined) : collapsed ? MenuUnfoldOutlined : MenuFoldOutlined
                )
              }
              onClick={() => setCollapsed(!collapsed)}
              aria-label="Toggle navigation"
            />
            <div className="header-branding">
              <span className="header-title">Ravindra POS</span>
            </div>
          </div>
          <div className="header-right">
            <Space size={16} align="center">
              <Button
                type="text"
                icon={theme === "light" ? "🌙" : "🌞"}
                onClick={toggleTheme}
                className="header-action-btn theme-toggle-btn"
                aria-label="Toggle theme"
              />
              <Badge
                count={cartItems.length}
                showZero
                offset={[-2, 6]}
                style={{
                  backgroundColor: "var(--danger)",
                  boxShadow: "0 2px 8px rgba(239, 68, 68, 0.4)",
                  fontSize: "11px",
                  fontWeight: 700,
                  zIndex: 2,
                }}
              >
                <Button
                  type="text"
                  icon={<ShoppingCartOutlined />}
                  onClick={() => navigate("/cart")}
                  className="header-action-btn cart-btn"
                  aria-label="Go to cart"
                />
              </Badge>
              <div className="header-action-btn user-profile" onClick={() => navigate("/profile")}> 
                <Avatar
                  src={user?.image}
                  icon={!user?.image && <UserOutlined />}
                  size={42}
                  style={{
                    backgroundColor: "var(--primary)",
                    cursor: "pointer",
                  }}
                />
              </div>
            </Space>
          </div>
        </Header>
        <Content className="content-area">
          <div className="content-inner">{children}</div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default DefaultLayout;
