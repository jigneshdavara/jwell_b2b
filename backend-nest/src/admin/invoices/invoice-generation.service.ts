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

                // Header Section with Company Info
                doc.fillColor(
                    primaryRgb
                        ? `rgb(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b})`
                        : '#0E244D',
                )
                    .fontSize(24)
                    .font('Helvetica-Bold')
                    .text('Elvee', 50, 50);

                doc.fontSize(10)
                    .fillColor(mediumGray)
                    .font('Helvetica')
                    .text('123 Business Street', 50, 75)
                    .text('Mumbai, Maharashtra 400001', 50, 88)
                    .text('Phone: +91 98765 43210', 50, 101)
                    .text('Email: info@elvee.com', 50, 114)
                    .text('GSTIN: 27AAAAA0000A1Z5', 50, 127);

                // Invoice Title (Right aligned)
                doc.fillColor(
                    primaryRgb
                        ? `rgb(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b})`
                        : '#0E244D',
                )
                    .fontSize(28)
                    .font('Helvetica-Bold')
                    .text('INVOICE', 400, 50, { align: 'right' });

                // Invoice Number and Details (Right aligned)
                let invoiceDetailsY = 85;
                doc.fontSize(10)
                    .fillColor(darkGray)
                    .font('Helvetica')
                    .text(
                        `Invoice Number: ${invoice.invoice_number}`,
                        400,
                        invoiceDetailsY,
                        { align: 'right' },
                    )
                    .text(
                        `Issue Date: ${this.formatDate(invoice.issue_date)}`,
                        400,
                        invoiceDetailsY + 13,
                        { align: 'right' },
                    );

                if (invoice.due_date) {
                    doc.text(
                        `Due Date: ${this.formatDate(invoice.due_date)}`,
                        400,
                        invoiceDetailsY + 26,
                        { align: 'right' },
                    );
                    invoiceDetailsY += 13;
                }

                if (invoice.order?.reference) {
                    doc.text(
                        `Order: ${invoice.order.reference}`,
                        400,
                        invoiceDetailsY + 26,
                        { align: 'right' },
                    );
                    invoiceDetailsY += 13;
                }

                // Status badge
                const statusY = invoiceDetailsY + 26;
                doc.roundedRect(400, statusY, 150, 20, 10)
                    .fillColor('#F3F4F6')
                    .fill()
                    .fillColor(
                        primaryRgb
                            ? `rgb(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b})`
                            : '#0E244D',
                    )
                    .fontSize(9)
                    .font('Helvetica-Bold')
                    .text(
                        invoice.status_label.toUpperCase(),
                        400,
                        statusY + 5,
                        {
                            align: 'right',
                            width: 140,
                        },
                    );

                // Draw horizontal line
                doc.moveTo(50, statusY + 35)
                    .lineTo(550, statusY + 35)
                    .lineWidth(1)
                    .strokeColor(mediumGray)
                    .stroke();

                let currentY = statusY + 50;

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

                // Items Table Header
                const tableStartY = currentY;
                const rowHeight = 40; // Increased row height to accommodate item name + SKU

                // Header background
                doc.fillColor(
                    primaryRgb
                        ? `rgb(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b})`
                        : '#0E244D',
                )
                    .rect(50, tableStartY, 500, 30)
                    .fill();

                // Table header text (white text on colored background)
                doc.fillColor('#FFFFFF')
                    .fontSize(11)
                    .font('Helvetica-Bold')
                    .text('Item', 60, tableStartY + 10, { width: 220 })
                    .text('Unit Price', 320, tableStartY + 10, {
                        width: 100,
                        align: 'right',
                    })
                    .text('Qty', 430, tableStartY + 10, {
                        width: 50,
                        align: 'center',
                    })
                    .text('Total', 490, tableStartY + 10, {
                        width: 50,
                        align: 'right',
                    });

                // Items
                let itemY = tableStartY + 35;
                if (invoice.order?.items && invoice.order.items.length > 0) {
                    invoice.order.items.forEach((item: any, index: number) => {
                        // Check if we need a new page
                        if (itemY + rowHeight > 680) {
                            doc.addPage();
                            itemY = 50;

                            // Redraw table header on new page
                            doc.fillColor(
                                primaryRgb
                                    ? `rgb(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b})`
                                    : '#0E244D',
                            )
                                .rect(50, itemY, 500, 30)
                                .fill();

                            doc.fillColor('#FFFFFF')
                                .fontSize(11)
                                .font('Helvetica-Bold')
                                .text('Item', 60, itemY + 10, { width: 220 })
                                .text('Unit Price', 320, itemY + 10, {
                                    width: 100,
                                    align: 'right',
                                })
                                .text('Qty', 430, itemY + 10, {
                                    width: 50,
                                    align: 'center',
                                })
                                .text('Total', 490, itemY + 10, {
                                    width: 50,
                                    align: 'right',
                                });
                            itemY += 35;
                        }

                        // Row background (light gray for better readability)
                        doc.fillColor('#FFFFFF')
                            .rect(50, itemY - 5, 500, rowHeight)
                            .fill();

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
                        doc.font('Helvetica-Bold')
                            .text(
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

                // Totals Section
                const totalsStartY = Math.max(itemY + 20, 650);
                const totalsBoxWidth = 200;
                const totalsBoxX = 350;

                // Draw totals box background
                doc.fillColor('#F9FAFB')
                    .rect(totalsBoxX, totalsStartY - 10, totalsBoxWidth, 100)
                    .fill();

                // Totals border
                doc.rect(totalsBoxX, totalsStartY - 10, totalsBoxWidth, 100)
                    .lineWidth(1)
                    .strokeColor('#E5E7EB')
                    .stroke();

                let totalsY = totalsStartY;
                doc.fillColor(mediumGray)
                    .fontSize(10)
                    .font('Helvetica')
                    .text('Subtotal:', totalsBoxX + 10, totalsY, { width: 100 })
                    .text(
                        this.formatCurrency(
                            parseFloat(invoice.subtotal_amount),
                            invoice.currency,
                        ),
                        totalsBoxX + 110,
                        totalsY,
                        { width: 80, align: 'right' },
                    );

                if (parseFloat(invoice.discount_amount) > 0) {
                    totalsY += 18;
                    doc.text('Discount:', totalsBoxX + 10, totalsY, {
                        width: 100,
                    })
                        .fillColor('#DC2626')
                        .text(
                            `-${this.formatCurrency(parseFloat(invoice.discount_amount), invoice.currency)}`,
                            totalsBoxX + 110,
                            totalsY,
                            { width: 80, align: 'right' },
                        )
                        .fillColor(mediumGray);
                }

                if (parseFloat(invoice.tax_amount) > 0) {
                    totalsY += 18;
                    doc.text('Tax (GST):', totalsBoxX + 10, totalsY, {
                        width: 100,
                    }).text(
                        this.formatCurrency(
                            parseFloat(invoice.tax_amount),
                            invoice.currency,
                        ),
                        totalsBoxX + 110,
                        totalsY,
                        { width: 80, align: 'right' },
                    );
                }

                // Grand Total line
                totalsY += 20;
                doc.moveTo(totalsBoxX + 10, totalsY)
                    .lineTo(totalsBoxX + totalsBoxWidth - 10, totalsY)
                    .lineWidth(1)
                    .strokeColor('#D1D5DB')
                    .stroke();

                totalsY += 10;
                doc.fillColor(
                    primaryRgb
                        ? `rgb(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b})`
                        : '#0E244D',
                )
                    .fontSize(12)
                    .font('Helvetica-Bold')
                    .text('Grand Total:', totalsBoxX + 10, totalsY, {
                        width: 100,
                    })
                    .text(
                        this.formatCurrency(
                            parseFloat(invoice.total_amount),
                            invoice.currency,
                        ),
                        totalsBoxX + 110,
                        totalsY,
                        { width: 80, align: 'right' },
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
                    }
                }

                // Footer on last page
                const pageCount = doc.bufferedPageRange().count;
                for (let i = 0; i < pageCount; i++) {
                    doc.switchToPage(i);
                    const pageHeight = doc.page.height;
                    const pageWidth = doc.page.width;

                    // Footer line
                    doc.moveTo(50, pageHeight - 60)
                        .lineTo(pageWidth - 50, pageHeight - 60)
                        .lineWidth(0.5)
                        .strokeColor('#E5E7EB')
                        .stroke();

                    // Footer text
                    doc.fontSize(8)
                        .fillColor(mediumGray)
                        .font('Helvetica')
                        .text(
                            'Thank you for your business!',
                            50,
                            pageHeight - 50,
                            { align: 'center', width: pageWidth - 100 },
                        )
                        .text(
                            `Invoice generated on ${new Date().toLocaleDateString(
                                'en-IN',
                                {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                },
                            )}`,
                            50,
                            pageHeight - 38,
                            { align: 'center', width: pageWidth - 100 },
                        );
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
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    }
}
