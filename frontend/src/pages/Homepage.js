import React, { useState, useEffect } from "react";
import DefaultLayout from "./../components/DefaultLayout";
import API from "../api";
import { Row, Col, Input, Empty } from "antd";
import { useDispatch } from "react-redux";
import { SearchOutlined } from "@ant-design/icons";
import ItemList from "../components/ItemList";

const Homepage = () => {
  const [itemsData, setItemsData] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("drinks");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    {
      name: "drinks",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/430/430561.png",
    },
    {
      name: "rice",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/3174/3174880.png",
    },
    {
      name: "noodles",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/1471/1471262.png",
    },
    {
      name: "snacks",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/2553/2553691.png",
    },
  ];

  const dispatch = useDispatch();
  useEffect(() => {
    const getAllItems = async () => {
      try {
        dispatch({ type: "SHOW_LOADING" });
        const { data } = await API.get("/api/items/get-item");
        setItemsData(data);
        dispatch({ type: "HIDE_LOADING" });
      } catch (error) {
        dispatch({ type: "HIDE_LOADING" });
        console.log(error);
      }
    };
    getAllItems();
  }, [dispatch]);

  const filteredItems = itemsData
    .filter((i) => (selectedCategory ? i.category === selectedCategory : true))
    .filter((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <DefaultLayout>
      <div className="page-hero">
        <div className="page-header">
          <div>
            <h1 className="page-title">Order Menu</h1>
            <p className="page-subtitle">Select products and add them to the current bill quickly with a clean POS interface.</p>
          </div>
          <div className="search-bar">
            <Input
              placeholder="Search items or scan barcode..."
              prefix={<SearchOutlined />}
              size="large"
              style={{ borderRadius: 12, width: "100%" }}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="category-scroll-container">
          <div
            className={`category-pill ${selectedCategory === "" ? "active" : ""}`}
            onClick={() => setSelectedCategory("")}
          >
            <span>All Items</span>
          </div>
          {categories.map((category) => (
            <div
              key={category.name}
              className={`category-pill ${selectedCategory === category.name ? "active" : ""}`}
              onClick={() => setSelectedCategory(category.name)}
            >
              <img src={category.imageUrl} alt={category.name} height="24" width="24" />
              <span>{category.name}</span>
            </div>
          ))}
        </div>

        <Row gutter={[16, 16]}>
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <Col xs={24} sm={12} md={8} lg={6} xl={6} key={item._id}>
                <ItemList item={item} />
              </Col>
            ))
          ) : (
            <Col span={24}>
              <Empty description="No products found in this category" />
            </Col>
          )}
        </Row>
      </div>
    </DefaultLayout>
  );
};

export default Homepage;
