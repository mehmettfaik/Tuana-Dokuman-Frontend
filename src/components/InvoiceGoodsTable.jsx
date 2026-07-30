import React from 'react';
import ArticleSearch from './ArticleSearch';

const InvoiceGoodsTable = ({ goods, handleGoodsChange, addGoods, removeGoods }) => {
  return (
    <div className="form-section">
      <div className="goods-header">
        <h3 className="section-title">DESCRIPTION OF GOODS</h3>
        <button
          type="button"
          className="btn btn-add-goods"
          onClick={addGoods}
        >
          + Yeni Ürün Ekle
        </button>
      </div>
      
      {goods.map((item, index) => (
        <div key={item.id} className="goods-item">
          <div className="goods-item-header">
            <h4 className="goods-item-title">Ürün #{index + 1}</h4>
            {goods.length > 1 && (
              <button
                type="button"
                className="btn btn-remove-goods"
                onClick={() => removeGoods(item.id)}
              >
                × Sil
              </button>
            )}
          </div>
          
          <div className="goods-container">
            <div className="goods-grid-row">
              <div className="form-group">
                <label className="form-label">ARTICLE NUMBER</label>
                <ArticleSearch
                  value={item['ARTICLE NUMBER']}
                  onChange={(val) => handleGoodsChange(item.id, 'ARTICLE NUMBER', val)}
                  onSelect={(article) => {
                    handleGoodsChange(item.id, 'ARTICLE NUMBER', article.articleNumber);
                    if (article.fabricWeightWidth) {
                      handleGoodsChange(item.id, 'WEIGHT / WIDHT', article.fabricWeightWidth);
                    }
                  }}
                  placeholder="Ürün numarası"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">WEIGHT / WIDHT</label>
                <input
                  type="text"
                  className="form-input"
                  value={item['WEIGHT / WIDHT']}
                  onChange={(e) => handleGoodsChange(item.id, 'WEIGHT / WIDHT', e.target.value)}
                  placeholder="Ağırlık ve en"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">QUANTITY (METERS)</label>
                <input
                  type="text"
                  className="form-input"
                  value={item['QUANTITY (METERS)']}
                  onChange={(e) => handleGoodsChange(item.id, 'QUANTITY (METERS)', e.target.value)}
                  placeholder="Miktar"
                />
              </div>
            </div>
            
            <div className="goods-grid-row">
              <div className="form-group">
                <label className="form-label">PRICE</label>
                <input
                  type="text"
                  className="form-input"
                  value={item['PRICE']}
                  onChange={(e) => handleGoodsChange(item.id, 'PRICE', e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === ',') {
                      e.preventDefault();
                    }
                  }}
                  placeholder="Birim fiyat (USD/EUR) Belirtiniz"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">AMOUNT</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={item['AMOUNT']}
                    onChange={(e) => handleGoodsChange(item.id, 'AMOUNT', e.target.value)}
                    placeholder="Toplam tutar (otom. hesaplanır)"
                    style={{ backgroundColor: '#f8f9fa', cursor: 'default', flex: '1' }}
                  />
                  <select
                    className="form-input"
                    value={item['CURRENCY']}
                    onChange={(e) => handleGoodsChange(item.id, 'CURRENCY', e.target.value)}
                    style={{ width: '80px', flex: '0 0 80px' }}
                  >
                    <option value="€ EUR">€ EUR</option>
                    <option value="$ USD">$ USD</option>
                    <option value="₺ TRY">₺ TRY</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default InvoiceGoodsTable;
