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

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from reportlab.pdfgen.canvas import Canvas
from reportlab.platypus import Image
from reportlab.lib.utils import ImageReader
from io import BytesIO
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Frame

from .models import temprano


# Función para crear texto rotado dentro de una celda
def rotar_texto(header, width=2, height=66, font_size=5):
    drawing = Drawing(width, height)
    drawing.rotate(90)
    lines = header.split('\n')
    y = 0
    for line in lines:
        drawing.add(String(0, y, line, fontSize=font_size))
        y -= font_size  # Ajusta el espaciado entre líneas según sea necesario
    return drawing


def texto_ajustado(header, width=26, height=-2, font_size=4):
    drawing = Drawing(width, height)
    drawing.rotate(0)
    lines = header.split('\n')
    y = 0
    for line in lines:
        drawing.add(String(0, y, line, fontSize=font_size))
        y -= font_size  # Ajusta el espaciado entre líneas según sea necesario
    return drawing


def texto_ajustado2(header, width=13, height=0, font_size=4):
    drawing = Drawing(width, height)
    drawing.rotate(0)
    lines = header.split('\n')
    y = 0
    for line in lines:
        drawing.add(String(0, y, line, fontSize=font_size))
        y -= font_size  # Ajusta el espaciado entre líneas según sea necesario
    return drawing


def texto_ajustado_tabla2(header, width=20, height=0, font_size=5):
    drawing = Drawing(width, height)
    drawing.rotate(0)
    lines = header.split('\n')
    y = 0
    for line in lines:
        drawing.add(String(0, y, line, fontSize=font_size))
        y -= font_size  # Ajusta el espaciado entre líneas según sea necesario
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
        title_style.alignment = 1  # Alinea el Titulo
        title_style.fontSize = 10  # Ajusta el tamaño de la fuente del título
        title_style.leading = 10  # Ajusta el interlineado del título
        elements.append(Paragraph(
            "ESTRATEGIA NACIONAL DE INMUNIZACIONES / DIRECCIÓN NACIONAL DE ESTADÍSTICA Y ANÁLISIS DE INFORMACIÓN DE SALUD<br/>"
            "REGISTRO DIARIO DE ACTIVIDADES DE VACUNACIÓN / Concentrado diario de Vacunación de 0 a 15 años de edad (CAPTACIÓN TEMPRANA) - 2024", title_style
        ))
        elements.append(Spacer(1, 1))  # Añadir espacio

        # Diccionario para convertir el nombre del mes al español
        meses_espanol = {
            1: "ENERO", 2: "FEBRERO", 3: "MARZO", 4: "ABRIL", 5: "MAYO", 6: "JUNIO",
            7: "JULIO", 8: "AGOSTO", 9: "SEPTIEMBRE", 10: "OCTUBRE", 11: "NOVIEMBRE", 12: "DICIEMBRE"
        }
        # Obtener el mes actual y convertirlo a letras en mayúscula
        nombre_mes = meses_espanol.get(mes_actual, "MES DESCONOCIDO")
        nombre_mes_siguiente = meses_espanol.get(
            mes_actual+1, "MES DESCONOCIDO")

        datos_temprano = temprano.objects.filter(
            tem_fech__month=mes_actual, eniUser_id=user_id).order_by('tem_fech', 'tem_tota')

        headers_1 = [
            '', '', 'Extramural', '', '', '', '', '', '', 'Sexo', '', 'LUGAR DE\nRESIDENCIA\nHABITULA', '', 'Nacionalidad', '', '', '', '', '', 'Autoidentificación étnica', '', '', '', '', '', '', '',
            'Menor de un año  / (0 a 11 meses)', '', '', '', '', '', '', '', '', '', '', '', '', '', '12 a 23 meses', '', '', '', '', '', '5 años', '', '    9 AÑOS\n     (NIÑAS)', '', '     10 Años\n     (NIÑAS)', '           15\n          años',
        ]

        headers_2 = [
            '', '', 'MIES', '', 'MINEDUC', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
            'Dosis única', '', '', '1ra Dosis', '', '', '', '2da Dosis', '', '', '', '3ra Dosis', '', '', '1ra\nDosis', 'Dosis única', '', '2da\nDosis', '4ta Dosis', '', '5ta Dosis', '', '1ra\nDosis', '2da\nDosis', '2da\nDosis', 'Tercer\nRefuerzo',
        ]

        headers_3 = [
            'Dia', 'Intramural', 'CNH', 'CIBV', 'E. General Básica', 'Bachillerato', 'VISITAS DOMICILIARIAS', 'ATENCIÓN COMUNITARIA', 'OTROS', 'Hombre', 'Mujer',
            'Pertenece al establecimiento de salud', 'No pertenece al establecimiento de salud', 'Ecuatoriana', 'Colombiano', 'Peruano', 'Cubano', 'Venezolano',
            'Otros', 'Indigena', 'Afro ecuatoriano/\nAfro descendiente', 'Negro/a', 'Mulato/a', 'Montubio/a', 'Mestizo/a', 'Blanco/a', 'Otro',
            'BCG primeras\n24 horas de nacido', 'HB primeras\n24 horas de nacido', '*BCG desde el 2do día de\nnacido hasta los 364 días (Tardía)',
            'Rotavirus', 'fIPV', 'Neumococo', 'Pentavalente', 'Rotavirus', 'fIPV', 'Neumococo', 'Pentavalente',
            'bOPV', 'Neumococo', 'Pentavalente', 'SRP', 'FA', 'Varicela', 'SRP', 'bOPV', 'DPT', 'bOPV', 'DPT', 'HPV', 'HPV', 'HPV', 'dT adulto',
        ]

        headers_4 = [
            '', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
            '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26',
        ]

        # Índices de las columnas que deseas rotar
        columnas_a_ajustar1 = [11, 49, 51, 52]

        # Aplicar rotar_texto solo a las columnas especificadas
        ajustar_headers_1 = [
            texto_ajustado(header) if i in columnas_a_ajustar1 else header
            for i, header in enumerate(headers_1)
        ]

        # Índices de las columnas que deseas rotar
        columnas_a_ajustar2 = [
            41, 42, 44, 49, 50, 51, 52
        ]

        # Aplicar rotar_texto solo a las columnas especificadas
        ajustar_headers_2 = [
            texto_ajustado2(header) if i in columnas_a_ajustar2 else header
            for i, header in enumerate(headers_2)
        ]

        # Aquí ajustamos el tamaño del ancho y alto de las celdas para rotar el texto
        rotated_headers_3 = [rotar_texto(header) for header in headers_3]

        # Encabezado de la tabla
        data = [ajustar_headers_1, ajustar_headers_2,
                rotated_headers_3, headers_4]

        # Crea un diccionario con los datos por dia
        datos_por_dia = {
            dato.tem_fech.day: dato for dato in datos_temprano if not dato.tem_tota
        }

        # Definir un estilo para las celdas que contienen ceros
        cero_style = ParagraphStyle(
            name='ZeroStyle',
            fontSize=4,  # Tamaño de la fuente más pequeño para ceros
            leading=4,   # Espaciado entre líneas más unido
            alignment=1  # Centrar el texto
        )

        # Función para aplicar el estilo de cero
        def format_cero(value):
            return Paragraph(str(value), cero_style) if value == 0 else value

        # Asegura que la tabla tenga 31 filas (días del mes)
        for dia in range(1, 32):
            if dia in datos_por_dia:
                dato = datos_por_dia[dia]
                valores = [
                    dia, dato.tem_intr, dato.tem_extr_mies_cnh, dato.tem_extr_mies_cibv, dato.tem_extr_mine_egen, dato.tem_extr_mine_bach, dato.tem_extr_visi, dato.tem_extr_aten, dato.tem_otro,
                    dato.tem_sexo_homb, dato.tem_sexo_muje, dato.tem_luga_pert, dato.tem_luga_nope, dato.tem_naci_ecua, dato.tem_naci_colo, dato.tem_naci_peru, dato.tem_naci_cuba,
                    dato.tem_naci_vene, dato.tem_naci_otro, dato.tem_auto_indi, dato.tem_auto_afro, dato.tem_auto_negr, dato.tem_auto_mula, dato.tem_auto_mont, dato.tem_auto_mest,
                    dato.tem_auto_blan, dato.tem_auto_otro,
                    dato.tem_men1_dosi_bcgp, dato.tem_men1_dosi_hbpr, dato.tem_men1_dosi_bcgd, dato.tem_men1_1rad_rota, dato.tem_men1_1rad_fipv,
                    dato.tem_men1_1rad_neum, dato.tem_men1_1rad_pent, dato.tem_men1_2dad_rota, dato.tem_men1_2dad_fipv, dato.tem_men1_2dad_neum, dato.tem_men1_2dad_pent, dato.tem_men1_3rad_bopv, dato.tem_men1_3rad_neum,
                    dato.tem_men1_3rad_pent, dato.tem_12a23m_1rad_srp, dato.tem_12a23m_dosi_fa, dato.tem_12a23m_dosi_vari, dato.tem_12a23m_2dad_srp, dato.tem_12a23m_4tad_bopv, dato.tem_12a23m_4tad_dpt, dato.tem_5ano_5tad_bopv,
                    dato.tem_5ano_5tad_dpt, dato.tem_9ano_1rad_hpv, dato.tem_9ano_2dad_hpv, dato.tem_10an_2dad_hpv, dato.tem_15an_terc_dtad
                ]
                # Aplicar format_cero a cada valor
                data.append([format_cero(valor) for valor in valores])
            else:
                # Si no hay datos los días son cero
                data.append([dia] + [format_cero(0) for _ in range(52)])

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
        header_height_1 = 20  # Altura del encabezado
        header_height_2 = 16
        header_height_3 = 70
        row_height = 10  # Altura de las filas de datos
        footer_height = 18  # Altura de la fila final

        # Crear la lista de alturas de las filas
        row_heights = [header_height_1, header_height_2, header_height_3] + [row_height] * \
            (len(data) - 4) + [footer_height]

        table = Table(
            data, colWidths=[col_width] * num_columns, rowHeights=row_heights
        )

        table.setStyle(TableStyle([
            # Fondo Primer encabezado
            ('BACKGROUND', (0, 0), (-1, 0), colors.white),
            # Fondo Segundo encabezado
            ('BACKGROUND', (0, 1), (-1, 1), colors.white),
            # Fondo Tercer encabezado
            ('BACKGROUND', (0, 2), (-1, 2), colors.white),
            # Fondo Cuarto encabezado
            ('BACKGROUND', (0, 3), (-1, 3), colors.white),
            # Unir filas
            # ('SPAN', (0, 0), (0, 3)),
            # ('SPAN', (1, 0), (1, 2)),
            # ('SPAN', (6, 1), (6, 2)),
            # ('SPAN', (7, 1), (7, 2)),
            # ('SPAN', (8, 0), (8, 2)),
            # ('SPAN', (11, 1), (11, 2)),
            # ('SPAN', (12, 1), (12, 2)),
            # ('SPAN', (13, 1), (13, 2)),
            # ('SPAN', (14, 1), (14, 2)),
            # ('SPAN', (15, 1), (15, 2)),
            # ('SPAN', (16, 1), (16, 2)),
            # ('SPAN', (17, 1), (17, 2)),
            # ('SPAN', (18, 1), (18, 2)),
            # ('SPAN', (19, 1), (19, 2)),
            # ('SPAN', (20, 1), (20, 2)),
            # ('SPAN', (21, 1), (21, 2)),
            # ('SPAN', (22, 1), (22, 2)),
            # ('SPAN', (23, 1), (23, 2)),
            # ('SPAN', (24, 1), (24, 2)),
            # ('SPAN', (25, 1), (25, 2)),
            # ('SPAN', (26, 1), (26, 2)),
            # Unir columnas
            ('SPAN', (2, 0), (7, 0)),
            ('SPAN', (9, 0), (10, 1)),
            ('SPAN', (11, 0), (12, 0)),
            ('SPAN', (13, 0), (18, 0)),
            ('SPAN', (19, 0), (26, 0)),
            ('SPAN', (27, 0), (40, 0)),
            ('SPAN', (41, 0), (46, 0)),
            ('SPAN', (47, 0), (48, 0)),
            ('SPAN', (49, 0), (50, 0)),
            ('SPAN', (2, 1), (3, 1)),
            ('SPAN', (4, 1), (5, 1)),
            ('SPAN', (27, 1), (29, 1)),
            ('SPAN', (30, 1), (33, 1)),
            ('SPAN', (34, 1), (37, 1)),
            ('SPAN', (38, 1), (40, 1)),
            ('SPAN', (42, 1), (43, 1)),
            ('SPAN', (45, 1), (46, 1)),
            ('SPAN', (47, 1), (48, 1)),
            # Rotar texto en headers_3
            # ('TEXTANGLE', (0, 4), (-1, 4), 90),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),  # Texto en blanco
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),  # Centrar texto
            # Centrar texto verticalmente
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            # Negrita en encabezado
            ('FONTNAME', (0, 0), (-1, 1), 'Helvetica-Bold'),
            # Tamaño de texto para las filas de datos
            ('FONTSIZE', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 3),  # Espaciado en encabezado
            # Color de fondo para el cuerpo
            # ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),  # Líneas de tabla
            # Negrita en la última fila
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ]))

        # Añadir la tabla como fondo
        elements.append(table)
        elements.append(Spacer(1, 3))  # Añadir espacio

        headers_1_1 = [
            '', 'NACIONALIDAD ETNICA (Llenar solo en caso en el que se autoidentifique como INDIGENA)', '', '',	'', '', '', '', '', '', '', '', '', '', '', '', '',
            'PUEBLOS (Llenar solo en caso de que se autoidentifique con etnia INDIGENA que tenga nacionalidad etnica KICHWA)', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
        ]

        headers_1_2 = [
            '', 'Achuar', 'Andoa', 'Awa', 'Chachi',	'Cofan', 'Epera', 'Huancavilca', 'Kichwa', 'Manta', 'Secoya', 'Shiwiar', 'Shuar', 'Siona', 'Tsáchila', 'Waorani', 'Zapara',
            'Chibuleo', 'Kañari', 'Karanki', 'Kayambi', 'Kichwa\nAmazónico', 'Kisapincha', 'Kitukara', 'Natabuela', 'Otavalo', 'Paltas', 'Panzaleo', 'Pastos', 'Puruha', 'Salasaka', 'Saraguro', 'Tomabela', 'Waramka',
        ]

        # Aquí ajustamos el tamaño del ancho y alto de las celdas para rotar el texto
        rotated_headers_1_2 = [texto_ajustado_tabla2(
            header) for header in headers_1_2]

        # Encabezado de la tabla
        data2 = [headers_1_1, rotated_headers_1_2]

        # Añadir la fila con tem_tota al final
        for dato in datos_temprano:
            if dato.tem_tota:
                data2.append([
                    "Total", dato.tem_naci_achu, dato.tem_naci_ando, dato.tem_naci_awa, dato.tem_naci_chac, dato.tem_naci_cofa, dato.tem_naci_eper, dato.tem_naci_huan, dato.tem_naci_kich, dato.tem_naci_mant, dato.tem_naci_seco, dato.tem_naci_shiw, dato.tem_naci_shua, dato.tem_naci_sion, dato.tem_naci_tsac, dato.tem_naci_waor, dato.tem_naci_zapa,
                    dato.tem_pueb_chib, dato.tem_pueb_kana, dato.tem_pueb_kara, dato.tem_pueb_kaya, dato.tem_pueb_kich, dato.tem_pueb_kisa, dato.tem_pueb_kitu, dato.tem_pueb_nata, dato.tem_pueb_otav, dato.tem_pueb_palt, dato.tem_pueb_panz, dato.tem_pueb_past, dato.tem_pueb_puru, dato.tem_pueb_sala, dato.tem_pueb_sara, dato.tem_pueb_toma, dato.tem_pueb_wara,
                ])
                break

        # Ajustar el ancho de cada columna de la tabla
        num_columns2 = len(data2[0])
        page_width2 = landscape(A4)[0] - 2 * margin
        col_width2 = page_width2 / num_columns2

        # Ajustar la altura de cada fila de la tabla
        header_height_1_1 = 10  # Altura del encabezado
        header_height_1_2 = 20
        row_height1 = 8  # Altura de las filas de datos
        footer_height1 = 12  # Altura de la fila final

        # Crear la lista de alturas de las filas
        row_heights2 = [header_height_1_1, header_height_1_2] + [row_height1] * \
            (len(data2) - 4) + [footer_height1]

        table2 = Table(
            data2, colWidths=[col_width2] * num_columns2, rowHeights=row_heights2
        )

        table2.setStyle(TableStyle([
            # Fondo Primer encabezado
            ('BACKGROUND', (0, 0), (-1, 0), colors.white),
            # Fondo Segundo encabezado
            ('BACKGROUND', (0, 1), (-1, 1), colors.white),
            # Unir columnas
            ('SPAN', (1, 0), (16, 0)),
            ('SPAN', (17, 0), (33, 0)),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),  # Texto en blanco
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),  # Centrar texto
            # Centrar texto verticalmente
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            # Negrita en encabezado
            ('FONTNAME', (0, 0), (-1, 1), 'Helvetica-Bold'),
            # Tamaño de texto para las filas de datos
            ('FONTSIZE', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 3),  # Espaciado en encabezado
            # Color de fondo para el cuerpo
            # ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),  # Líneas de tabla
            # Negrita en la última fila
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ]))

        # Añadir la tabla como fondo
        elements.append(table2)
        elements.append(Spacer(1, 1))  # Añadir espacio

        # Añadir párrafo descriptivo
        body_text_style = styles['BodyText']
        body_text_style.alignment = 0  # Alinear a la izquierda
        elements.append(Paragraph(
            f"MES de Reporte: {nombre_mes} / {nombre_mes_siguiente}"
            "; UNIDAD DE SALUD: PUESTO DE VIGILANCIA DE HUAQUILLAS<br/>"
            "RESPONSABLE: Lic. JAJAJAJA JAJAJA JAJAJAJA JAJAJAJAJAJAJA", body_text_style
        ))

        # Construir el PDF
        doc.build(elements)

        return response
    else:
        return HttpResponse(status=405)  # Método no permitido
