from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from reportlab.lib.pagesizes import A4, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from PyPDF2 import PdfReader, PdfWriter
from .models import temprano
import io


@csrf_exempt
def reporteTempranoPDF(request):
    if request.method == 'GET':
        # Obtener datos del cuerpo de la solicitud GET
        mes_actual = int(request.GET.get('mes_actual'))
        user_id = int(request.GET.get('user_id'))

        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="reporte_temprano.pdf"'

        # Configurar márgenes de 3 mm
        margin = 3 * mm
        buffer = io.BytesIO()

        # Crear el PDF temporal con ReportLab (contenido dinámico)
        temp_buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            temp_buffer, pagesize=landscape(A4), leftMargin=margin, rightMargin=margin, topMargin=margin, bottomMargin=margin
        )
        elements = []

        # Estilos
        # styles = getSampleStyleSheet()

        # Añadir título
        # title_style = styles['Title']
        # title_style.alignment = 1  # Alinea el Tilo
        # elements.append(Paragraph("Reporte Mensual de Temprano", title_style))
        # elements.append(Spacer(1, 12))  # Añadir espacio

        # Diccionario para convertir el nombre del mes al español
        meses_espanol = {
            1: "ENERO", 2: "FEBRERO", 3: "MARZO", 4: "ABRIL", 5: "MAYO", 6: "JUNIO",
            7: "JULIO", 8: "AGOSTO", 9: "SEPTIEMBRE", 10: "OCTUBRE", 11: "NOVIEMBRE", 12: "DICIEMBRE"
        }
        # Obtener el mes actual y convertirlo a letras en mayúscula
        nombre_mes = meses_espanol.get(mes_actual, "MES DESCONOCIDO")
        # Obtener los datos de 'temprano' del mes y usuario
        datos_temprano = temprano.objects.filter(
            tem_fech__month=mes_actual, eniUser_id=user_id).order_by('tem_fech', 'tem_tota')

        # Estructurar los datos en una tabla
        data = []
        # Crea un diccionario con los datos por dia
        datos_por_dia = {
            dato.tem_fech.day: dato for dato in datos_temprano if not dato.tem_tota
        }

        # Asegura que la tabla tenga 31 filas (días del mes)
        for dia in range(1, 32):
            if dia in datos_por_dia:
                dato = datos_por_dia[dia]
                data.append([
                    dia, dato.tem_intr, dato.tem_extr_mies_cnh, dato.tem_extr_mies_cibv, dato.tem_extr_mine_egen, dato.tem_extr_mine_bach, dato.tem_extr_visi, dato.tem_extr_aten, dato.tem_otro,
                    dato.tem_sexo_homb, dato.tem_sexo_muje, dato.tem_luga_pert, dato.tem_luga_nope, dato.tem_naci_ecua, dato.tem_naci_colo, dato.tem_naci_peru, dato.tem_naci_cuba,
                    dato.tem_naci_vene, dato.tem_naci_otro, dato.tem_auto_indi, dato.tem_auto_afro, dato.tem_auto_negr, dato.tem_auto_mula, dato.tem_auto_mont, dato.tem_auto_mest,
                    dato.tem_auto_blan, dato.tem_auto_otro,
                    dato.tem_men1_dosi_bcgp, dato.tem_men1_dosi_hbpr, dato.tem_men1_dosi_bcgd, dato.tem_men1_1rad_rota, dato.tem_men1_1rad_fipv,
                    dato.tem_men1_1rad_neum, dato.tem_men1_1rad_pent, dato.tem_men1_2dad_rota, dato.tem_men1_2dad_fipv, dato.tem_men1_2dad_neum, dato.tem_men1_2dad_pent, dato.tem_men1_3rad_bopv, dato.tem_men1_3rad_neum,
                    dato.tem_men1_3rad_pent, dato.tem_12a23m_1rad_srp, dato.tem_12a23m_dosi_fa, dato.tem_12a23m_dosi_vari, dato.tem_12a23m_2dad_srp, dato.tem_12a23m_4tad_bopv, dato.tem_12a23m_4tad_dpt, dato.tem_5ano_5tad_bopv,
                    dato.tem_5ano_5tad_dpt, dato.tem_9ano_1rad_hpv, dato.tem_9ano_2dad_hpv, dato.tem_10an_2dad_hpv, dato.tem_15an_terc_dtad
                ])
            else:
                # Si no hay datos los días son cero
                data.append([dia] + [0] * 52)

        # Añadir la fila con tem_tota al final
        for dato in datos_temprano:
            if dato.tem_tota:
                data.append([
                    "", dato.tem_intr, dato.tem_extr_mies_cnh, dato.tem_extr_mies_cibv, dato.tem_extr_mine_egen, dato.tem_extr_mine_bach, dato.tem_extr_visi, dato.tem_extr_aten, dato.tem_otro,
                    dato.tem_sexo_homb, dato.tem_sexo_muje, dato.tem_luga_pert, dato.tem_luga_nope, dato.tem_naci_ecua, dato.tem_naci_colo, dato.tem_naci_peru, dato.tem_naci_cuba,
                    dato.tem_naci_vene, dato.tem_naci_otro, dato.tem_auto_indi, dato.tem_auto_afro, dato.tem_auto_negr, dato.tem_auto_mula, dato.tem_auto_mont, dato.tem_auto_mest,
                    dato.tem_auto_blan, dato.tem_auto_otro,
                    dato.tem_men1_dosi_bcgp, dato.tem_men1_dosi_hbpr, dato.tem_men1_dosi_bcgd, dato.tem_men1_1rad_rota, dato.tem_men1_1rad_fipv,
                    dato.tem_men1_1rad_neum, dato.tem_men1_1rad_pent, dato.tem_men1_2dad_rota, dato.tem_men1_2dad_fipv, dato.tem_men1_2dad_neum, dato.tem_men1_2dad_pent, dato.tem_men1_3rad_bopv, dato.tem_men1_3rad_neum,
                    dato.tem_men1_3rad_pent, dato.tem_12a23m_1rad_srp, dato.tem_12a23m_dosi_fa, dato.tem_12a23m_dosi_vari, dato.tem_12a23m_2dad_srp, dato.tem_12a23m_4tad_bopv, dato.tem_12a23m_4tad_dpt, dato.tem_5ano_5tad_bopv,
                    dato.tem_5ano_5tad_dpt, dato.tem_9ano_1rad_hpv, dato.tem_9ano_2dad_hpv, dato.tem_10an_2dad_hpv, dato.tem_15an_terc_dtad
                ])
                break

        # Ajustar el ancho de cada columna de la tabla
        num_columns = len(data[0])
        page_width = landscape(A4)[0] - 3 * margin
        col_width = page_width / num_columns
        col_widths = [5.4 * mm] * 27 + [col_width] * (num_columns - 26)

        # Ajustar la altura de cada fila de la tabla
        row_height = 11.6  # Altura de las filas de datos
        footer_height = 20  # Altura de la fila final

        # Crear la lista de alturas de las filas
        row_heights = [row_height] * (len(data) - 1) + [footer_height]

        table = Table(
            data, colWidths=col_widths, rowHeights=row_heights
        )

        table.setStyle(TableStyle([
            # ('BACKGROUND', (0, 0), (-1, 0), colors.grey),  # Fondo para encabezado
            # ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),  # Texto en blanco
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),  # Centrar texto
            # Centrar texto verticalmente
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            # Negrita en encabezado
            # ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            # Tamaño de texto para las filas de datos
            ('FONTSIZE', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 6),  # Espaciado en encabezado
            # ('GRID', (0, 0), (-1, -1), 1, colors.black),  # Líneas de tabla
            # Negrita en la última fila
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ]))

        # Añadir espacio antes de la tabla para ajustar su posición
        elements.append(Spacer(1, 106))

        # Añadir la tabla a los elementos
        elements.append(table)
        # Construir el documento PDF temporal
        doc.build(elements)

        # Abrir la plantilla con PyPDF2
        template_pdf_path = "eni/plantillasPDF/tempranoPlantilla.pdf"
        with open(template_pdf_path, "rb") as template_file:
            template_reader = PdfReader(template_file)
            # Suponemos una página de plantilla
            template_page = template_reader.pages[0]

            # Cargar el PDF generado dinámicamente
            temp_buffer.seek(0)
            temp_reader = PdfReader(temp_buffer)
            temp_page = temp_reader.pages[0]

            # Combinar la página de la plantilla con la página generada
            template_page.merge_page(temp_page)

            # Crear el escritor de PDF final
            output_writer = PdfWriter()
            output_writer.add_page(template_page)

            # Escribir el PDF final en el buffer de salida
            output_buffer = io.BytesIO()
            output_writer.write(output_buffer)
            output_buffer.seek(0)

            # Enviar el PDF como respuesta
            response.write(output_buffer.read())
        return response
    else:
        return HttpResponse(status=405)  # Método no permitido
