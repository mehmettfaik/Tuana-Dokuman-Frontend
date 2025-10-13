// src/components/SelectDocument.jsx
import React from 'react';

const SelectDocument = ({ selectedDocType, setSelectedDocType }) => {
  return (
    <div>
      <label>BELGE TÜRÜ:</label>
      <select
        value={selectedDocType}
        onChange={(e) => setSelectedDocType(e.target.value)}
      >
        <option value="">BELGE SEÇİNİZ</option>
        <option value="teknikFoy">TECHNICAL SHEET</option>
        <option value="proformaInvoice">PROFORMA INVOICE</option>
        <option value="invoice">INVOICE</option>
        <option value="packingList">PACKING LIST</option>
        <option value="creditNote">CREDIT NOTE</option>
        <option value="debitNote">DEBIT NOTE</option>
        <option value="orderConfirmation">ORDER CONFIRMATION</option>
        <option value="siparis">SİPARİŞ FORMU</option>
        <option value="priceOffer">PRICE OFFER</option>

        {/* İleride başka belgeler eklersen buraya */}
      </select>
    </div>
  );
};

export default SelectDocument;
