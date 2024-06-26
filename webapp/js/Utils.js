sap.ui.define([
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/ui/export/Spreadsheet",
], function (MessageToast, JSONModel, Spreadsheet) {
    "use strict";

    var that = this;

    return {

        getStyleSearchHelps: function (that) {
            var oView = that.getView();
            var oSHModel = that.getOwnerComponent().getModel("SearchHelps");
            var oModel = that.getOwnerComponent().getModel();

            oModel.setHeaders({
                sbu: that._sbu
            });

            oSHModel.setHeaders({
                sbu: that._sbu
            });

            //get Seasons
            var oJSONModel0 = new JSONModel();
            oSHModel.read("/SeasonSet", {
                success: function (oData, oResponse) {
                    oJSONModel0.setData(oData);
                    oJSONModel0.setSizeLimit(9999);
                    oView.setModel(oJSONModel0, "SeasonsModel");
                },
                error: function (err) { }
            });

            //get Product Types
            var oJSONModel1 = new JSONModel();
            oSHModel.read("/ProductTypeSet", {
                success: function (oData, oResponse) {
                    oJSONModel1.setData(oData);
                    oJSONModel1.setSizeLimit(9999);
                    oView.setModel(oJSONModel1, "ProdTypeModel");
                },
                error: function (err) { }
            });

            //get Style Cat
            var oJSONModel2 = new JSONModel();
            oSHModel.read("/StyleCatSet", {
                success: function (oData, oResponse) {
                    oJSONModel2.setData(oData);
                    oJSONModel2.setSizeLimit(9999);
                    oView.setModel(oJSONModel2, "StyleCatModel");
                },
                error: function (err) { }
            });

            //get Sales Groups
            var oJSONModel3 = new JSONModel();
            oSHModel.read("/SalesGroupSet", {
                success: function (oData, oResponse) {
                    oJSONModel3.setData(oData);
                    oJSONModel3.setSizeLimit(9999);
                    oView.setModel(oJSONModel3, "SalesGroupModel");
                },
                error: function (err) { }
            });

            //get Customer Groups
            var oJSONModel4 = new JSONModel();
            oSHModel.read("/CustomerGroupSet", {
                success: function (oData, oResponse) {
                    oJSONModel4.setData(oData);
                    oJSONModel4.setSizeLimit(9999);
                    oView.setModel(oJSONModel4, "CustGroupModel")
                },
                error: function (err) { }
            });

            //get Customers
            var oJSONModel5 = new JSONModel();
            oSHModel.read("/SoldToCustSet", {
                success: function (oData, oResponse) {
                    oJSONModel5.setData(oData);
                    oJSONModel5.setSizeLimit(9999);
                    oView.setModel(oJSONModel5, "CustomersModel")
                },
                error: function (err) { }
            });

            //get Size Groups
            // var oJSONModel6 = new JSONModel();
            // oSHModel.read("/SizeGrpSet", {
            //     success: function (oData, oResponse) {
            //         oJSONModel6.setData(oData);
            //         // oJSONModel6.setSizeLimit(9999);
            //         oView.setModel(oJSONModel6, "SizeGroupModel");
            //     },
            //     error: function (err) { }
            // });

            //get UoM
            var oJSONModel7 = new JSONModel();
            oSHModel.read("/UOMSet", {
                success: function (oData, oResponse) {
                    oJSONModel7.setData(oData);
                    oJSONModel7.setSizeLimit(9999);
                    oView.setModel(oJSONModel7, "UOMModel");
                },
                error: function (err) { }
            });
            
        },

        getAttributesSearchHelps: function (that) {
            var oView = that.getView();

            var oModel = that.getOwnerComponent().getModel();
            var oSHModel = that.getOwnerComponent().getModel("SearchHelps");
            
            oModel.setHeaders({
                sbu: that._sbu
            });

            oSHModel.setHeaders({
                sbu: that._sbu
            });

            //get Attributes
            var oJSONModel1 = new JSONModel();
            oSHModel.setHeaders({
                dispgrp: "STYINFO"
            });
            oSHModel.read("/AttribTypeSet", {
                success: function (oData, oResponse) {
                    oJSONModel1.setData(oData);
                    oJSONModel1.setSizeLimit(9999);
                    oView.setModel(oJSONModel1, "AttribTypeModel");
                },
                error: function (err) { }
            });

            //get Attribute Codes
            var oJSONModel2 = new JSONModel();
            oSHModel.read("/AttribCodeSet", {
                success: function (oData, oResponse) {
                    oJSONModel2.setData(oData);
                    oJSONModel2.setSizeLimit(9999);
                    oView.setModel(oJSONModel2, "AttribCdModel");
                },
                error: function (err) { }
            });

            //Process Codes
            var oJSONModel3 = new JSONModel();
            oSHModel.read("/ProcessCodeSet", {
                success: function (oData, oResponse) {
                    oJSONModel3.setData(oData);
                    oJSONModel3.setSizeLimit(9999);
                    oView.setModel(oJSONModel3, "ProcessCodeModel");
                },
                error: function (err) { }
            });

            //VAS Types
            var oJSONModel6 = new JSONModel();
            oSHModel.read("/VASTypeSet", {
                success: function (oData, oResponse) {
                    oJSONModel6.setData(oData);
                    oJSONModel6.setSizeLimit(9999);
                    oView.setModel(oJSONModel6, "VASTypeModel");
                },
                error: function (err) { }
            });

        },

        getProcessAttributes: function(that) {
            var oView = that.getView();
            var oSHModel = that.getOwnerComponent().getModel("SearchHelps");

            //get Process Attribute Types
            var oJSONModel1 = new JSONModel();
            oSHModel.setHeaders({
                styleno: that._styleNo
            });
            oSHModel.read("/ProcessAttribTypeSet", {
                success: function (oData, oResponse) {
                    oJSONModel1.setData(oData);
                    oJSONModel1.setSizeLimit(9999);
                    oView.setModel(oJSONModel1, "ProcessAttribTypeModel");
                },
                error: function (err) { }
            });

            //get Process Attribute Codes
            var oJSONModel2 = new JSONModel();
            oSHModel.read("/ProcessAttribCodeSet", {
                success: function (oData, oResponse) {
                    oJSONModel2.setData(oData);
                    oJSONModel2.setSizeLimit(9999);
                    oView.setModel(oJSONModel2, "ProcessAttribCodeModel");
                },
                error: function (err) { }
            });
        },

        getVersionSearchHelps: function (that) {
            var me = that;

            var oView = that.getView();

            var oModel = that.getOwnerComponent().getModel();
            oModel.setHeaders({
                sbu: that._sbu
            });

            var oSHModel = that.getOwnerComponent().getModel("SearchHelps");
            oSHModel.setHeaders({
                sbu: that._sbu,
                dispgrp: "STYINFO"
            });

            // //get Attribute Types
            // var oJSONModel1 = new JSONModel();
            // oSHModel.read("/AttribTypeSet", {
            //     success: function (oData, oResponse) {
            //         oJSONModel1.setData(oData);
            //         oJSONModel1.setSizeLimit(9999);
            //         oView.setModel(oJSONModel1, "AttribTypeModel");
            //     },
            //     error: function (err) { }
            // });

            // //get Attribute Codes
            // var oJSONModel2 = new JSONModel();
            // oSHModel.read("/AttribCodeSet", {
            //     success: function (oData, oResponse) {
            //         oJSONModel2.setData(oData);
            //         oJSONModel2.setSizeLimit(9999);
            //         oView.setModel(oJSONModel2, "AttribCdModel");
            //     },
            //     error: function (err) { }
            // });

            // //Usage Classes
            // var oJSONModel3 = new JSONModel();
            // oSHModel.read("/UsageClassSet", {
            //     success: function (oData, oResponse) {
            //         oJSONModel3.setData(oData);
            //         oView.setModel(oJSONModel3, "UsageClassModel");
            //     },
            //     error: function (err) { }
            // });

            //get UoM
            var oJSONModel4 = new JSONModel();
            oSHModel.read("/UOMSet", {
                success: function (oData, oResponse) {
                    oJSONModel4.setData(oData.results);
                    oJSONModel4.setSizeLimit(9999);
                    oView.setModel(oJSONModel4, "UOMModel");
                    oView.setModel(oJSONModel4, "UOMGMCModel");
                    that.getOwnerComponent().getModel("LOOKUP_MODEL").setProperty("/UOMVHModel",oData.results);
                    that.getOwnerComponent().getModel("LOOKUP_MODEL").setProperty("/UOMGMCVHModel",oData.results);
                },
                error: function (err) { }
            });

            // //Process Codes
            // var oJSONModel5 = new JSONModel();
            // oSHModel.read("/ProcessCodeSet", {
            //     success: function (oData, oResponse) {
            //         oJSONModel5.setData(oData);
            //         oJSONModel5.setSizeLimit(9999);
            //         oView.setModel(oJSONModel5, "ProcessCodeModel");
            //     },
            //     error: function (err) { }
            // });

            // //get Material Types
            // var oJSONModel6 = new JSONModel();
            // oSHModel.read("/MatTypeSet", {
            //     success: function (oData, oResponse) {
            //         oJSONModel6.setData(oData);
            //         oJSONModel6.setSizeLimit(9999);
            //         oView.setModel(oJSONModel6, "MatTypeModel");
            //     },
            //     error: function (err) { }
            // });

            // //get GMC
            // var oJSONModel7 = new JSONModel();
            // oSHModel.read("/GMCSet", {
            //     success: function (oData, oResponse) {
            //         oJSONModel7.setData(oData);
            //         oJSONModel7.setSizeLimit(9999);
            //         oView.setModel(oJSONModel7, "GMCModel");
            //     },
            //     error: function (err) { }
            // });

            // //get Styles
            // var oJSONModel8 = new JSONModel();
            // oSHModel.read("/StylesSet", {
            //     success: function (oData, oResponse) {
            //         oJSONModel8.setData(oData);
            //         oJSONModel8.setSizeLimit(9999);
            //         oView.setModel(oJSONModel8, "StylesModel");
            //     },
            //     error: function (err) { }
            // });

            //get Supply Types
            var oJSONModel9 = new JSONModel();
            oSHModel.read("/SupplyTypeSet", {
                success: function (oData, oResponse) {
                    oJSONModel9.setData(oData.results);
                    oJSONModel9.setSizeLimit(9999);
                    oView.setModel(oJSONModel9, "SupplyTypeModel");
                    that.getOwnerComponent().getModel("LOOKUP_MODEL").setProperty("/SupplyTypeVHModel",oData.results);
                },
                error: function (err) { }
            });

            //get Vendors
            var oJSONModel10 = new JSONModel();
            oSHModel.read("/VendorSet", {
                success: function (oData, oResponse) {
                    oJSONModel10.setData(oData.results);
                    oJSONModel10.setSizeLimit(9999);
                    oView.setModel(oJSONModel10, "VendorModel");
                    that.getOwnerComponent().getModel("LOOKUP_MODEL").setProperty("/VendorVHModel",oData.results);
                },
                error: function (err) { }
            });

            //get Currencies
            var oJSONModel11 = new JSONModel();
            oSHModel.read("/CurrencySet", {
                success: function (oData, oResponse) {
                    oJSONModel11.setData(oData.results);
                    oJSONModel11.setSizeLimit(9999);
                    oView.setModel(oJSONModel11, "CurrencyModel");
                    that.getOwnerComponent().getModel("LOOKUP_MODEL").setProperty("/CurrencyVHModel",oData.results);
                },
                error: function (err) { }
            });            

            //get Purchasing Groups
            var oJSONModel12 = new JSONModel();
            oSHModel.read("/PurGrpSet", {
                success: function (oData, oResponse) {
                    // console.log("PurGrpSet", oData.results);
                    oJSONModel12.setData(oData.results);
                    oJSONModel12.setSizeLimit(9999);
                    oView.setModel(oJSONModel12, "PurchGroupModel");
                    that.getOwnerComponent().getModel("LOOKUP_MODEL").setProperty("/PurchGroupVHModel",oData.results);
                },
                error: function (err) { }
            }); 
            
            //get Purchasing Plants
            var oJSONModel99 = new JSONModel();
            oSHModel.read("/PurPlant2Set", {
                success: function (oData, oResponse) {
                    // console.log("PurPlantSet", oData.results);
                    oJSONModel99.setData(oData.results);
                    oJSONModel99.setSizeLimit(9999);
                    oView.setModel(oJSONModel99, "PurPlantModel");
                    that.getOwnerComponent().getModel("LOOKUP_MODEL").setProperty("/PurPlantModel",oData.results);
                },
                error: function (err) { }
            });

            //get Purchasing Plants
            var oJSONModel14 = new JSONModel();
            oSHModel.read("/PartCodeSet", {
                success: function (oData, oResponse) {
                    oJSONModel14.setData(oData.results);
                    oJSONModel14.setSizeLimit(9999);
                    oView.setModel(oJSONModel14, "PartCdModel");
                    that.getOwnerComponent().getModel("LOOKUP_MODEL").setProperty("/PartCdModel",oData.results);
                },
                error: function (err) { }
            });
        },

        // onSeasonsValueHelp: function (oEvent, oView) {
        //     var sInputValue = oEvent.getSource().getValue();
        //     that.inputId = oEvent.getSource().getId();
        //     that._oView = oView;
        //     if (!oView._seasonsHelpDialog) {
        //         oView._seasonsHelpDialog = sap.ui.xmlfragment("zui3derp.view.fragments.Seasons", oView);
        //         oView._seasonsHelpDialog.attachSearch(this._seasonsGroupValueHelpSearch);   
        //         oView._seasonsHelpDialog.attachConfirm(this._seasonsGroupValueHelpClose);  
        //         oView._seasonsHelpDialog.attachCancel(this._seasonsGroupValueHelpClose);  
        //         oView.getView().addDependent(oView._seasonsHelpDialog);
        //     }
        //     oView._seasonsHelpDialog.open(sInputValue);
        // },

        // _seasonsGroupValueHelpSearch: function (evt) {
        //     var sValue = evt.getParameter("value");
        //     var andFilter = [], orFilter = [];
        //     orFilter.push(new sap.ui.model.Filter("Seasoncd", sap.ui.model.FilterOperator.Contains, sValue));
        //     orFilter.push(new sap.ui.model.Filter("Desc1", sap.ui.model.FilterOperator.Contains, sValue));
        //     andFilter.push(new sap.ui.model.Filter(orFilter, false));
        //     evt.getSource().getBinding("items").filter(new sap.ui.model.Filter(andFilter, true));
        // },

        // _seasonsGroupValueHelpClose: function (evt) {
        //     var oSelectedItem = evt.getParameter("selectedItem");
        //     if (oSelectedItem) {
        //         var productInput = sap.ui.getCore().byId(that.inputId);
        //         productInput.setValue(oSelectedItem.getTitle());
        //         try {
        //             that._oView.onHeaderChange();
        //         } catch (err) {}
        //     }
        //     evt.getSource().getBinding("items").filter([]);
        // },

        onExport: function (oEvent) {
            var oButton = oEvent.getSource();
            var tabName = oButton.data('TableName')
            var oTable = this.getView().byId(tabName);
            // var oExport = oTable.exportData();

            var aCols = [], aRows, oSettings, oSheet;
            var aParent, aChild;
            var fileName;

            var columns = oTable.getColumns();
            console.log(columns);
            for (var i = 0; i < columns.length; i++) {
                aCols.push({
                    // label: columns[i].mProperties.filterProperty,
                    label: columns[i].mAggregations.label.mProperties.text,                    
                    property: columns[i].mProperties.filterProperty,
                    type: 'string'
                })
            }

            var property;

            if (tabName === 'styleDetldBOMTab') {
                property = '/results/items';
                aParent = oTable.getModel('DataModel').getProperty(property);

                aRows = [];

                for (var i = 0; i < aParent.length; i++) {
                    aRows.push(aParent[i]);
                    try {
                        for (var j = 0; j < aParent[i].items.length; j++) {
                            aChild = aParent[i].items[j];
                            aRows.push(aChild);

                            try {
                                for (var k = 0; k < aChild.items.length; k++) {
                                    aChild = aParent[i].items[j].items[k];
                                    aRows.push(aChild);
                                }
                            } catch(err) {}
                        }
                    } catch(err) {}
                }
                
            } 
            else if (tabName === "styleMatListTab" || tabName === "ioMatListTab") {
                property = '/rows';
                aRows = oTable.getModel().getProperty(property);
            }
            else {
                property = '/results';
                aRows = oTable.getModel('DataModel').getProperty(property);
            }

            var date = new Date();
            fileName = tabName + " " + date.toLocaleDateString('en-us', { year: "numeric", month: "short", day: "numeric" });

            oSettings = {
                fileName: fileName,
                workbook: { columns: aCols },
                dataSource: aRows
            };

            oSheet = new Spreadsheet(oSettings);
            oSheet.build()
                .then(function () {
                    MessageToast.show('Spreadsheet export has finished');
                })
                .finally(function () {
                    oSheet.destroy();
                });
        }

    };
});