// src/components/SelectDocument.jsx
import React from 'react';

const SelectDocument = ({ selectedDocType, setSelectedDocType }) => {
  return (
    <div>
      <label>Belge Türü:</label>
      <select
        value={selectedDocType}
        onChange={(e) => setSelectedDocType(e.target.value)}
      >
        <option value="">Belge Seçiniz</option>
        <option value="teknikFoy">Technical Sheet</option>
        <option value="proformaInvoice">Proforma Invoice</option>
        <option value="invoice">Invoice</option>
        <option value="packingList">Packing List</option>
        <option value="creditNote">Credit Note</option>
        <option value="debitNote">Debit Note</option>
        <option value="orderConfirmation">Order Confirmation</option>
        <option value="siparis">Sipariş Formu</option>
        <option value="priceOffer">Price Offer</option>

        {/* İleride başka belgeler eklersen buraya */}
      </select>
    </div>
  );
};

export default SelectDocument;
