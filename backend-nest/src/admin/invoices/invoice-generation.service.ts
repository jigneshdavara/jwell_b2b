import { Injectable } from '@nestjs/common';
import PDFDocument = require('pdfkit');

@Injectable()
export class InvoiceGenerationService {
    generatePdf(invoice: any): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    margin: 50,
                    size: 'A4',
                    info: {
                        Title: `Invoice ${invoice.invoice_number}`,
                        Author: 'Elvee',
                        Subject: 'Invoice',
                    },
                });
                const buffers: Buffer[] = [];

                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => {
                    const pdfBuffer = Buffer.concat(buffers);
                    resolve(pdfBuffer);
                });
                doc.on('error', reject);

                // Colors (RGB values for PDFKit)
                const primaryColor = '#0E244D'; // Elvee Blue
                const accentColor = '#AE8135'; // Feather Gold
                const darkGray = '#1F2937';
                const mediumGray = '#6B7280';
                const lightGray = '#F3F4F6';

                // Convert hex to RGB
                const hexToRgb = (hex: string) => {
                    const result =
                        /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                    return result
                        ? {
                              r: parseInt(result[1], 16),
                              g: parseInt(result[2], 16),
                              b: parseInt(result[3], 16),
                          }
                        : null;
                };

                const primaryRgb = hexToRgb(primaryColor);
                const accentRgb = hexToRgb(accentColor);

                // ============================================
                // HEADER - Company Name Centered (Top)
                // ============================================
                doc.fillColor(darkGray)
                    .fontSize(28)
                    .font('Helvetica-Bold')
                    .text('Elvee Luxury Jewellery', 50, 50, {
                        align: 'center',
                        width: doc.page.width - 100,
                    });

                // ============================================
                // LEFT SIDE - Company Info (FROM)
                // ============================================
                let leftY = 90;
                doc.fillColor(darkGray)
                    .fontSize(10)
                    .font('Helvetica-Bold')
                    .text('FROM:', 50, leftY);

                leftY += 15;
                doc.fontSize(10)
                    .font('Helvetica')
                    .fillColor(mediumGray)
                    .text('Elvee Luxury Jewellery', 50, leftY)
                    .text('123 Business Street', 50, leftY + 13)
                    .text('Mumbai, Maharashtra 400001', 50, leftY + 26)
                    .text('Phone: +91 98765 43210', 50, leftY + 39)
                    .text('Email: info@elvee.com', 50, leftY + 52)
                    .text('GSTIN: 27AAAAA0000A1Z5', 50, leftY + 65);

                // ============================================
                // RIGHT SIDE - Invoice Details
                // ============================================
                const invoiceBoxX = 350;
                const invoiceBoxWidth = 200;
                let invoiceY = 90;

                // Invoice Number
                doc.fillColor(darkGray)
                    .fontSize(10)
                    .font('Helvetica-Bold')
                    .text('Invoice Number:', invoiceBoxX, invoiceY, {
                        align: 'right',
                        width: invoiceBoxWidth,
                    });
                invoiceY += 14;
                doc.font('Helvetica')
                    .fillColor(mediumGray)
                    .text(invoice.invoice_number, invoiceBoxX, invoiceY, {
                        align: 'right',
                        width: invoiceBoxWidth,
                    });

                invoiceY += 18;

                // Issue Date
                doc.font('Helvetica-Bold')
                    .fillColor(darkGray)
                    .fontSize(10)
                    .text('Invoice Date:', invoiceBoxX, invoiceY, {
                        align: 'right',
                        width: invoiceBoxWidth,
                    });
                invoiceY += 14;
                doc.font('Helvetica')
                    .fillColor(mediumGray)
                    .text(
                        this.formatDate(invoice.issue_date),
                        invoiceBoxX,
                        invoiceY,
                        {
                            align: 'right',
                            width: invoiceBoxWidth,
                        },
                    );

                if (invoice.due_date) {
                    invoiceY += 18;
                    doc.font('Helvetica-Bold')
                        .fillColor(darkGray)
                        .fontSize(10)
                        .text('Due Date:', invoiceBoxX, invoiceY, {
                            align: 'right',
                            width: invoiceBoxWidth,
                        });
                    invoiceY += 14;
                    doc.font('Helvetica')
                        .fillColor(mediumGray)
                        .text(
                            this.formatDate(invoice.due_date),
                            invoiceBoxX,
                            invoiceY,
                            {
                                align: 'right',
                                width: invoiceBoxWidth,
                            },
                        );
                }

                if (invoice.order?.reference) {
                    invoiceY += 18;
                    doc.font('Helvetica-Bold')
                        .fillColor(darkGray)
                        .fontSize(10)
                        .text('Order Ref:', invoiceBoxX, invoiceY, {
                            align: 'right',
                            width: invoiceBoxWidth,
                        });
                    invoiceY += 14;
                    doc.font('Helvetica')
                        .fillColor(mediumGray)
                        .text(invoice.order.reference, invoiceBoxX, invoiceY, {
                            align: 'right',
                            width: invoiceBoxWidth,
                        });
                }

                // ============================================
                // SEPARATOR LINE
                // ============================================
                const separatorY = Math.max(leftY + 80, invoiceY + 20);
                doc.moveTo(50, separatorY)
                    .lineTo(550, separatorY)
                    .lineWidth(1)
                    .strokeColor('#E5E7EB')
                    .stroke();

                let currentY = separatorY + 25;

                // Bill To Section (Left side)
                doc.fillColor(darkGray)
                    .fontSize(10)
                    .font('Helvetica-Bold')
                    .text('Bill To:', 50, currentY);

                if (invoice.order?.user) {
                    currentY += 18;
                    doc.fontSize(12)
                        .font('Helvetica-Bold')
                        .text(
                            invoice.order.user.business_name ||
                                invoice.order.user.name,
                            50,
                            currentY,
                        );

                    currentY += 16;
                    doc.fontSize(10)
                        .font('Helvetica')
                        .fillColor(mediumGray)
                        .text(invoice.order.user.email || '', 50, currentY);

                    if (invoice.order.user.address?.line1) {
                        currentY += 13;
                        doc.text(
                            invoice.order.user.address.line1,
                            50,
                            currentY,
                        );
                    }
                    if (invoice.order.user.address?.line2) {
                        currentY += 13;
                        doc.text(
                            invoice.order.user.address.line2,
                            50,
                            currentY,
                        );
                    }
                    const addressParts = [
                        invoice.order.user.address?.city,
                        invoice.order.user.address?.state,
                        invoice.order.user.address?.postal_code,
                    ]
                        .filter(Boolean)
                        .join(', ');
                    if (addressParts) {
                        currentY += 13;
                        doc.text(addressParts, 50, currentY);
                    }
                    if (invoice.order.user.gst_number) {
                        currentY += 13;
                        doc.text(
                            `GST: ${invoice.order.user.gst_number}`,
                            50,
                            currentY,
                        );
                    }
                    if (invoice.order.user.pan_number) {
                        currentY += 13;
                        doc.text(
                            `PAN: ${invoice.order.user.pan_number}`,
                            50,
                            currentY,
                        );
                    }
                }

                // Move to items section
                currentY = Math.max(currentY + 30, 280);

                // Items Table Header (Simple text, no background)
                const tableStartY = currentY;
                const rowHeight = 40;

                // Table header text (simple text, no background)
                doc.fillColor(darkGray)
                    .fontSize(11)
                    .font('Helvetica-Bold')
                    .text('ITEM DESCRIPTION', 60, tableStartY + 10, {
                        width: 220,
                    })
                    .text('UNIT PRICE', 320, tableStartY + 10, {
                        width: 100,
                        align: 'right',
                    })
                    .text('QTY', 430, tableStartY + 10, {
                        width: 50,
                        align: 'center',
                    })
                    .text('AMOUNT', 490, tableStartY + 10, {
                        width: 50,
                        align: 'right',
                    });

                // Header underline
                doc.moveTo(50, tableStartY + 25)
                    .lineTo(550, tableStartY + 25)
                    .lineWidth(1)
                    .strokeColor('#E5E7EB')
                    .stroke();

                // Items
                let itemY = tableStartY + 35;
                if (invoice.order?.items && invoice.order.items.length > 0) {
                    invoice.order.items.forEach((item: any, index: number) => {
                        // Check if we need a new page
                        if (itemY + rowHeight > 680) {
                            doc.addPage();
                            itemY = 50;

                            // Redraw table header on new page (simple text)
                            doc.fillColor(darkGray)
                                .fontSize(11)
                                .font('Helvetica-Bold')
                                .text('ITEM DESCRIPTION', 60, itemY + 10, {
                                    width: 220,
                                })
                                .text('UNIT PRICE', 320, itemY + 10, {
                                    width: 100,
                                    align: 'right',
                                })
                                .text('QTY', 430, itemY + 10, {
                                    width: 50,
                                    align: 'center',
                                })
                                .text('AMOUNT', 490, itemY + 10, {
                                    width: 50,
                                    align: 'right',
                                });

                            // Header underline
                            doc.moveTo(50, itemY + 25)
                                .lineTo(550, itemY + 25)
                                .lineWidth(1)
                                .strokeColor('#E5E7EB')
                                .stroke();

                            itemY += 35;
                        }

                        // Item name (bold, dark color)
                        doc.fillColor(darkGray)
                            .fontSize(11)
                            .font('Helvetica-Bold')
                            .text(item.name || '-', 60, itemY, { width: 220 });

                        // SKU (below item name, smaller, gray)
                        if (item.sku) {
                            doc.fontSize(9)
                                .fillColor(mediumGray)
                                .font('Helvetica')
                                .text(`SKU: ${item.sku}`, 60, itemY + 15, {
                                    width: 220,
                                });
                        }

                        // Unit Price (aligned with header, vertically centered)
                        doc.fillColor(darkGray)
                            .fontSize(10)
                            .font('Helvetica')
                            .text(
                                this.formatCurrency(
                                    parseFloat(item.unit_price || 0),
                                    invoice.currency,
                                ),
                                320,
                                itemY + 10,
                                { width: 100, align: 'right' },
                            );

                        // Quantity (aligned with header, vertically centered)
                        doc.text(
                            item.quantity?.toString() || '1',
                            430,
                            itemY + 10,
                            {
                                width: 50,
                                align: 'center',
                            },
                        );

                        // Total (bold, aligned with header, vertically centered)
                        doc.font('Helvetica-Bold').text(
                            this.formatCurrency(
                                parseFloat(item.total_price || 0),
                                invoice.currency,
                            ),
                            490,
                            itemY + 10,
                            { width: 50, align: 'right' },
                        );

                        // Row bottom border
                        doc.moveTo(50, itemY + rowHeight - 5)
                            .lineTo(550, itemY + rowHeight - 5)
                            .lineWidth(0.5)
                            .strokeColor('#E5E7EB')
                            .stroke();

                        itemY += rowHeight;
                    });
                }

                // Totals Section (Right-aligned, at bottom of page)
                // Position at bottom of page (A4 height ~792, leave ~50px margin)
                const totalsStartY = 700;
                const totalsBoxWidth = 200;
                const totalsBoxX = 350; // Right side of page

                let totalsY = totalsStartY;
                doc.fillColor(darkGray)
                    .fontSize(10)
                    .font('Helvetica')
                    .text(
                        `Subtotal: ${this.formatCurrency(
                            parseFloat(invoice.subtotal_amount),
                            invoice.currency,
                        )}`,
                        totalsBoxX,
                        totalsY,
                        {
                            align: 'right',
                            width: totalsBoxWidth,
                        },
                    );

                if (parseFloat(invoice.discount_amount) > 0) {
                    totalsY += 20;
                    doc.fillColor(mediumGray)
                        .text(
                            `Discount: -${this.formatCurrency(
                                parseFloat(invoice.discount_amount),
                                invoice.currency,
                            )}`,
                            totalsBoxX,
                            totalsY,
                            {
                                align: 'right',
                                width: totalsBoxWidth,
                            },
                        )
                        .fillColor(darkGray);
                }

                if (parseFloat(invoice.tax_amount) > 0) {
                    totalsY += 20;
                    doc.text(
                        `Tax (GST): ${this.formatCurrency(
                            parseFloat(invoice.tax_amount),
                            invoice.currency,
                        )}`,
                        totalsBoxX,
                        totalsY,
                        {
                            align: 'right',
                            width: totalsBoxWidth,
                        },
                    );
                }

                // Grand Total
                totalsY += 20;
                doc.moveTo(totalsBoxX, totalsY)
                    .lineTo(totalsBoxX + totalsBoxWidth, totalsY)
                    .lineWidth(1)
                    .strokeColor('#D1D5DB')
                    .stroke();

                totalsY += 15;
                doc.fillColor(darkGray)
                    .fontSize(12)
                    .font('Helvetica-Bold')
                    .text(
                        `TOTAL: ${this.formatCurrency(
                            parseFloat(invoice.total_amount),
                            invoice.currency,
                        )}`,
                        totalsBoxX,
                        totalsY,
                        {
                            align: 'right',
                            width: totalsBoxWidth,
                        },
                    );

                // Notes and Terms (on same page if space, otherwise new page)
                let notesY = totalsY + 40;
                if (notesY > 700 && (invoice.notes || invoice.terms)) {
                    doc.addPage();
                    notesY = 50;
                }

                if (invoice.notes || invoice.terms) {
                    if (invoice.notes) {
                        doc.fillColor(darkGray)
                            .fontSize(11)
                            .font('Helvetica-Bold')
                            .text('Notes:', 50, notesY);
                        doc.fontSize(9)
                            .fillColor(mediumGray)
                            .font('Helvetica')
                            .text(invoice.notes, 50, notesY + 15, {
                                width: 500,
                                align: 'left',
                            });
                        notesY += 50;
                    }

                    if (invoice.terms) {
                        doc.fillColor(darkGray)
                            .fontSize(11)
                            .font('Helvetica-Bold')
                            .text('Terms & Conditions:', 50, notesY);
                        doc.fontSize(9)
                            .fillColor(mediumGray)
                            .font('Helvetica')
                            .text(invoice.terms, 50, notesY + 15, {
                                width: 500,
                                align: 'left',
                            });
                        notesY += 50;
                    }
                }

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    private formatDate(date: Date | string | null): string {
        if (!date) return 'N/A';
        const d = new Date(date);
        return d.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }

    private formatCurrency(amount: number, currency: string = 'INR'): string {
        // Format number with Indian locale (lakhs, crores)
        const formatted = new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);

        // Use "Rs." instead of ₹ for better PDFKit font compatibility
        return `Rs. ${formatted}`;
    }
}
