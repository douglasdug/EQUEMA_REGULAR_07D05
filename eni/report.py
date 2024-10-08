from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from reportlab.lib.pagesizes import A4, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.graphics.shapes import Drawing, String
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from .models import temprano
import json


# Función para crear texto rotado dentro de una celda


def rotar_texto(text, width, height, font_size=8):
    drawing = Drawing(width, height)
    drawing.rotate(90)
    drawing.add(String(-10, -11, text, fontSize=font_size))
    return drawing


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
        doc = SimpleDocTemplate(response, pagesize=landscape(
            A4), leftMargin=margin, rightMargin=margin, topMargin=margin, bottomMargin=margin)
        elements = []

        # Estilos
        styles = getSampleStyleSheet()

        # Añadir título
        title_style = styles['Title']
        title_style.alignment = 1  # Alinea el Tilo
        elements.append(Paragraph("Reporte Mensual de Temprano", title_style))
        elements.append(Spacer(1, 12))  # Añadir espacio

        # Diccionario para convertir el nombre del mes al español
        meses_espanol = {
            1: "ENERO", 2: "FEBRERO", 3: "MARZO", 4: "ABRIL", 5: "MAYO", 6: "JUNIO",
            7: "JULIO", 8: "AGOSTO", 9: "SEPTIEMBRE", 10: "OCTUBRE", 11: "NOVIEMBRE", 12: "DICIEMBRE"
        }
        # Obtener el mes actual y convertirlo a letras en mayúscula
        # mes_actual = 1
        nombre_mes = meses_espanol.get(mes_actual, "MES DESCONOCIDO")
        # user_id = 1
        datos_temprano = temprano.objects.filter(
            tem_fech__month=mes_actual, eniUser_id=user_id).order_by('tem_fech', 'tem_tota')

        # Crear tabla de datos con rotación en encabezado
        headers_1 = [
            'Fecha', 'Intramural', 'CNH', 'CIBV', 'E. General Básica', 'Bachillerato', 'VISITAS DOMICILIARIAS', 'ATENCIÓN COMUNITARIA', 'OTROS', 'Hombre', 'Mujer',
            'Pertenece al establecimiento de salud', 'No pertenece al establecimiento de salud', 'Ecuatoriana', 'Colombiano', 'Peruano', 'Cubano', 'Venezolano',
            'Otros', 'Indigena', 'Afro ecuatoriano/ Afro descendiente', 'Negro/a', 'Mulato/a', 'Montubio/a', 'Mestizo/a', 'Blanco/a', 'Otro',
            'BCG primeras 24 horas de nacido', 'HB primeras 24 horas de nacido', '*BCG desde el 2do día de nacido hasta los 364 días (Tardía)',
            'Rotavirus', 'fIPV', 'Neumococo', 'Pentavalente', 'Rotavirus', 'fIPV', 'Neumococo', 'Pentavalente',
            'bOPV', 'Neumococo', 'Pentavalente', 'SRP', 'FA', 'Varicela', 'SRP', 'bOPV', 'DPT', 'bOPV', 'DPT', 'HPV', 'HPV', 'HPV', 'dT adulto',
        ]

        headers_2 = [
            'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'AA',
            '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26',
        ]

        # Aquí ajustamos el tamaño del ancho y alto de las celdas para rotar el texto
        rotated_headers_1 = [
            rotar_texto(header, width=20, height=80, font_size=6) for header in headers_1
        ]

        data = [rotated_headers_1, headers_2]  # Encabezado de la tabla

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
                data.append([
                    dia, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
                ])

        # Añadir la fila con tem_tota al final
        for dato in datos_temprano:
            if dato.tem_tota:
                data.append([
                    "Total", dato.tem_intr, dato.tem_extr_mies_cnh, dato.tem_extr_mies_cibv, dato.tem_extr_mine_egen, dato.tem_extr_mine_bach, dato.tem_extr_visi, dato.tem_extr_aten, dato.tem_otro,
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
        page_width = landscape(A4)[0] - 2 * margin
        col_width = page_width / num_columns

        # Ajustar la altura de cada fila de la tabla
        header_height = 100  # Altura del encabezado
        row_height = 11  # Altura de las filas de datos
        footer_height = 20  # Altura de la fila final

        # Crear la lista de alturas de las filas
        row_heights = [header_height] + [row_height] * \
            (len(data) - 2) + [footer_height]

        table = Table(
            data, colWidths=[col_width] * num_columns, rowHeights=row_heights
        )

        table.setStyle(TableStyle([
            ('BACKGROUND', (1, 0), (-1, 0), colors.grey),  # Fondo para encabezado
            # Fondo para el segundo encabezado
            ('BACKGROUND', (0, 1), (-1, 1), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),  # Texto en blanco
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),  # Centrar texto
            # Centrar texto verticalmente
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            # Negrita en encabezado
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            # Tamaño de texto para las filas de datos
            ('FONTSIZE', (0, 1), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 6),  # Espaciado en encabezado
            # Color de fondo para el cuerpo
            # ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),  # Líneas de tabla
            # Negrita en la última fila
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ]))
        elements.append(table)
        elements.append(Spacer(1, 12))  # Añadir espacio

        # Añadir párrafo descriptivo
        body_text_style = styles['BodyText']
        body_text_style.alignment = 0  # Alinear a la izquierda
        elements.append(Paragraph(
            f"Este reporte muestra los datos del modelo Temprano para el mes de {nombre_mes}.", body_text_style))

        # Construir el PDF
        doc.build(elements)

        return response
    else:
        return HttpResponse(status=405)  # Método no permitido
