<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:output method="xml" encoding="UTF-8" />

	<xsl:template match="*">
		<xsl:element name="{local-name()}">
			<xsl:if test="local-name()='subrecord'">
				<xsl:attribute name="index">
					<xsl:value-of select="position()"/>
				</xsl:attribute>
			</xsl:if>
			<xsl:apply-templates select="@* | node()"/>
		</xsl:element>
	</xsl:template>

	<xsl:template match="@*">
		<xsl:attribute name="{local-name()}">
			<xsl:value-of select="."/>
		</xsl:attribute>
	</xsl:template>

	<!--xsl:template match="subrecord">
		<subrecord>
			
			<xsl:apply-templates select="@* | node()"/>
		</subrecord>
	</xsl:template-->
	
</xsl:stylesheet>
