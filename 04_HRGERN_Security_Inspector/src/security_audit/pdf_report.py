from __future__ import annotations
import html
from pathlib import Path
from .report import load_audit

def generate_pdf(audit_json: str, output: str) -> Path:
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib import colors
        from reportlab.lib.styles import getSampleStyleSheet
    except ImportError as e: raise RuntimeError('PDF support requires reportlab') from e
    data=load_audit(audit_json); styles=getSampleStyleSheet(); doc=SimpleDocTemplate(output,pagesize=A4)
    story=[Paragraph('Security Audit Report',styles['Title']),Paragraph('Target: '+html.escape(data['target']),styles['BodyText']),Spacer(1,12)]
    rows=[['ID','Severity','Status','Title']]+[[str(f['id']),str(f['severity']),str(f['status']),str(f['title'])] for f in data['findings']]
    table=Table(rows,repeatRows=1); table.setStyle(TableStyle([('GRID',(0,0),(-1,-1),0.5,colors.grey),('BACKGROUND',(0,0),(-1,0),colors.lightgrey)])); story.append(table)
    story.append(Spacer(1,12)); story.append(Paragraph('Human verification is required before security claims.',styles['BodyText']))
    doc.build(story); return Path(output)
